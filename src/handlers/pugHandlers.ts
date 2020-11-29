import log from '../log';
import { formatDistance } from 'date-fns';
import { User } from 'discord.js';
import { Pug, Users } from '~models';
import { computePickingOrder } from '~utils';
import { addGuildGameType, deleteGuildGameType } from '~actions';
import store, { addGameType, removeGameType, addPug } from '~store';
import { formatPugFilledDM, formatJoinStatus } from '../formatting';

export type JoinStatus = {
  name: string;
  result: 'full' | 'present' | 'joined' | 'not-found';
  user?: User;
  pug?: Pug;
};

export const handleAddGameType: Handler = async (message, args) => {
  log.info(`Entering handleAddGameType`);
  const { guild } = message;
  if (!guild) return;

  const guildId = guild.id;
  const cache = store.getState();
  const { gameTypes } = cache.pugs[guildId];

  const [name, noOfPlayers, noOfTeams] = [
    args[0].toLowerCase(),
    Number(args[1]),
    Number(args[2]),
  ];

  if (!name || isNaN(noOfPlayers) || isNaN(noOfTeams)) {
    message.channel.send(`Invalid usage of command`);
    return;
  }

  if (gameTypes.some((g) => g.name === name)) {
    log.debug(`Gametype ${name} already exists`);
    message.channel.send(`Gametype with name ${name} already exists`);
    return;
  }

  const pickingOrder = computePickingOrder(noOfPlayers, noOfTeams);
  if (pickingOrder === null) {
    log.debug(
      `Picking order cannot be computed from ${noOfPlayers} players and ${noOfTeams} teams`
    );
    message.channel.send(
      `Invalid number of players/teams. Picking order cannot be computed`
    );
    return;
  }

  const newGameType = {
    name,
    noOfPlayers,
    noOfTeams,
    pickingOrder,
    isCoinFlipEnabled: false,
  };
  await addGuildGameType(guildId, newGameType);
  log.info(`Added new gametype ${name} to guild ${guildId}`);

  store.dispatch(addGameType({ ...newGameType, guildId }));

  message.channel.send(`**${name}** has been added`);
  log.info(`Exiting handleAddGameType`);
};

export const handleDeleteGameType: Handler = async (message, args) => {
  log.info(`Entering handleDeleteGameType`);
  const { guild } = message;
  if (!guild) return;

  const cache = store.getState();
  const { gameTypes } = cache.pugs[guild.id];

  const name = args[0].toLowerCase();

  if (!name) {
    message.channel.send(`Invalid usage of command`);
    return;
  }

  if (!gameTypes.some((g) => g.name === name)) {
    log.debug(`Gametype ${name} does not exist`);
    message.channel.send(`Gametype with name ${name} does not exist`);
    return;
  }

  await deleteGuildGameType(guild.id, name);
  log.info(`Deleted gametype ${name} from guild ${guild.id}`);

  store.dispatch(removeGameType({ guildId: guild.id, name }));

  message.channel.send(`**${name}** has been deleted`);
  log.info(`Exiting handleDeleteGameType`);
};

export const handleJoinGameTypes: Handler = async (message, args, user) => {
  log.info(`Entering handleJoinGameTypes`);
  const { guild } = message;
  if (!guild) return;

  const cache = store.getState();
  const { gameTypes, list } = cache.pugs[guild.id];
  const { list: blockedList } = cache.blocks[guild.id];

  const block = blockedList.find((b) => b.culprit.id === user.id);
  if (block) {
    log.debug(
      `${user.id} cannot join pugs on ${guild.id} because they are blocked`
    );
    message.channel.send(
      `**${
        user.username
      }** is blocked from joining pugs. Block expires in **${formatDistance(
        new Date(),
        new Date(block.expiresAt)
      )}**`
    );
    return;
  }

  const isPartOfFilledPug = list.find(
    (p) => p.isInPickingMode && p.players.some((u) => u.id === user.id)
  );
  if (isPartOfFilledPug) {
    log.debug(
      `${user.id} needs to leave ${isPartOfFilledPug.name} on ${guild.id} first to join other pugs`
    );
    message.channel.send(
      `Please leave **${isPartOfFilledPug.name.toUpperCase()}** first to join other pugs`
    );
  }

  const dbUser = await Users.findOne({
    userId: user.id,
    guildId: guild.id,
  }).exec();

  let toBroadcast: Pug | undefined;
  const joinStatuses = args.map((game): JoinStatus | undefined => {
    if (!toBroadcast) {
      let result: 'full' | 'present' | 'joined' | 'not-found';
      const gameType = gameTypes.find((g) => g.name === game);
      if (!gameType) {
        result = 'not-found';
        return { name: game, result };
      }

      const existingPug = list.find((p) => p.name === game);
      const pug = existingPug ?? new Pug(gameType);

      const pickingStatusBeforeJoining = pug.isInPickingMode;

      if (pug.isInPickingMode) {
        log.debug(
          `${user.id} cannot join ${pug.name} on ${guild.id} because it is already filled`
        );
        result = 'full';
      } else if (pug.players.find((p) => p.id === user.id)) {
        log.debug(
          `${user.id} cannot join ${pug.name} on ${guild.id} because they are already in`
        );
        result = 'present';
      } else {
        const gameTypeStats = dbUser?.stats[game] ?? {
          lost: 0,
          won: 0,
          totalPugs: 0,
          totalCaptain: 0,
          rating: 0,
        };
        pug.addPlayer({
          id: user.id,
          name: user.username,
          stats: { [game]: gameTypeStats },
        });
        result = 'joined';
        log.info(`${user.id} joined ${pug.name} on ${guild.id}`);
      }

      if (pug.players.length === pug.noOfPlayers && !pug.isInPickingMode) {
        pug.fillPug(guild.id);
        log.info(`Filled pug ${pug.name} on ${guild.id}`);
      }

      const pickingStatusAfterJoining = pug.isInPickingMode;
      if (!pickingStatusBeforeJoining && pickingStatusAfterJoining) {
        toBroadcast = pug;
      }

      if (!existingPug && result === 'joined') {
        log.debug(`Adding ${pug.name} to store for guild ${guild.id}`);
        store.dispatch(addPug({ guildId: guild.id, pug }));
      }
      return { name: game, user, pug, result };
    }
  });

  message.channel.send(
    formatJoinStatus(joinStatuses.filter(Boolean) as JoinStatus[])
  );

  if (toBroadcast) {
    //TODO: compute leave messages
    // let allLeaveMsgs = ``;
    // for (let i = 0; i < list.length; i++) {
    //   const otherPug = list[i];
    //   if (otherPug.name !== toBroadcast.name) {
    //     let allPugLeaveMsgs = ``;
    //     for (let j = 0; j < toBroadcast.players.length; j++) {
    //       const player = toBroadcast.players[j];
    //     }
    //   }
    // }
    /*
     * Send DM to each player that pug fileld
     */
    const DM = formatPugFilledDM(toBroadcast, guild.name);
    toBroadcast.players.forEach((player) => {
      const user = message.client.users.cache.get(player.id);
      user?.send(DM);
    });

    // TODO: handle case for 1v1 pug
  }

  log.info(`Exiting handleJoinGameTypes`);
};

import log from '../log';
import { formatDistance } from 'date-fns';
import { User } from 'discord.js';
import { Pug, Users } from '~models';
import { computePickingOrder } from '~utils';
import { addGuildGameType, deleteGuildGameType } from '~actions';
import store, { addGameType, removeGameType, addPug, removePug } from '~store';
import {
  formatPugFilledDM,
  formatJoinStatus,
  formatLeaveStatus,
  formatDeadPugs,
  formatBroadcastPug,
} from '../formatting';

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

export const handleJoinGameTypes: Handler = async (
  message,
  args,
  mentioned
) => {
  log.info(`Entering handleJoinGameTypes`);
  const { guild, author } = message;
  if (!guild) return;

  const user = mentioned || author;
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
      let result: JoinStatus['result'];
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
    let allLeaveMsgs = ``;
    for (let i = 0; i < list.length; i++) {
      const otherPug = list[i];
      if (otherPug.name !== toBroadcast.name) {
        let allPugLeaveMsgs = ``;
        for (let j = 0; j < toBroadcast.players.length; j++) {
          const player = toBroadcast.players[j];
          if (otherPug.players.find((p) => p.id === player.id)) {
            const user = message.client.users.cache.get(player.id);
            const msg = await handleLeaveGameTypes(
              message,
              [otherPug.name],
              user,
              true
            );
            allPugLeaveMsgs += `${msg} `;
          }
        }
        allLeaveMsgs += `${allPugLeaveMsgs} \n`;
      }
    }

    if (allLeaveMsgs) {
      message.channel.send(allLeaveMsgs);
    }

    message.channel.send(formatBroadcastPug(toBroadcast));

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

export const handleLeaveGameTypes: Handler = async (
  message,
  args,
  mentioned,
  returnMsg
) => {
  log.info(`Entering handleLeaveGameTypes`);
  const { guild, author } = message;
  if (!guild) return;

  const user = mentioned || author;
  const cache = store.getState();
  const { gameTypes, list } = cache.pugs[guild.id];

  if (args.length === 0) {
    message.channel.send(`Invalid, no pugs were mentioned`);
    return;
  }

  const leaveStatuses = args.map(
    (game): LeaveStatus => {
      let result: LeaveStatus['result'];
      const gameType = gameTypes.find((g) => g.name === game);
      if (!gameType) {
        result = 'not-found';
        return { name: game, result };
      }

      const pug = list.find((p) => p.name === game);
      const isInPug = Boolean(pug && pug.players.find((u) => u.id === user.id));
      if (pug && isInPug) {
        pug.removePlayer(user.id);
        log.info(`Removed user ${user.id} from ${game} in ${guild.id}`);
        if (pug.isInPickingMode) {
          pug.stopPug();
          log.info(`Stopped pug ${game} at ${guild.id}`);
        }
        result = 'left';
      } else {
        result = 'not-in';
      }

      return { name: game, result, pug, user };
    }
  );

  // Compute dead pugs
  const deadPugs = leaveStatuses.reduce((acc, { pug, user }) => {
    if (pug && user) {
      if (pug.players.length === pug.noOfPlayers - 1) {
        acc.push({ pug, user });
      }
      if (pug.isEmpty()) {
        store.dispatch(removePug({ guildId: guild.id, name: pug.name }));
        log.info(
          `Removed pug ${pug.name} at guild ${guild.id} because there are 0 players in`
        );
      }
    }
    return acc;
  }, [] as { pug: Pug; user: User }[]);

  const leaveMessage = formatLeaveStatus(leaveStatuses);

  if (!returnMsg) {
    message.channel.send(leaveMessage);
    deadPugs.length > 0 && message.channel.send(formatDeadPugs(deadPugs));
  } else {
    // Displaying dead pug first because we're returning the message after that
    deadPugs.length > 0 && message.channel.send(formatDeadPugs(deadPugs));
    return leaveMessage;
  }
};

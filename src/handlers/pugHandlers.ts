import { formatDistance } from 'date-fns';
import log from '../log';
import { computePickingOrder } from '~utils';
import { addGuildGameType, deleteGuildGameType } from '~actions';
import store, { addGameType, removeGameType } from '~store';
import { Pug } from '~models';

export const handleAddGameType: Handler = async (message, args) => {
  log.info(`Entering handleAddGameType`);
  const { guild } = message;
  const guildId = guild?.id as string;
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
    ja: 5,
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
  const guildId = guild?.id as string;
  const cache = store.getState();
  const { gameTypes } = cache.pugs[guildId];

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

  await deleteGuildGameType(guildId, name);
  log.info(`Deleted gametype ${name} from guild ${guildId}`);

  store.dispatch(removeGameType({ guildId, name }));

  message.channel.send(`**${name}** has been deleted`);
  log.info(`Exiting handleDeleteGameType`);
};

export const handleJoinGameTypes: Handler = async (message, args, user) => {
  log.info(`Entering handleJoinGameTypes`);
  const { guild } = message;
  const guildId = guild?.id as string;
  const cache = store.getState();
  const { gameTypes, list } = cache.pugs[guildId];
  const { list: blockedList } = cache.blocks[guildId];

  const block = blockedList.find((b) => b.culprit.id === user.id);
  if (block) {
    log.debug(
      `${user.id} cannot join pugs on ${guildId} because they are blocked`
    );
    message.channel.send(
      `**${
        user.user.username
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
      `${user.id} needs to leave ${isPartOfFilledPug.name} on ${guildId} first to join other pugs`
    );
    message.channel.send(
      `Please leave **${isPartOfFilledPug.name.toUpperCase()}** first to join other pugs`
    );
  }

  log.info(`Exiting handleJoinGameTypes`);
};

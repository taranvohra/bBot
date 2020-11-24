import log from '../../log';
import { computePickingOrder } from '~utils';
import { addGuildGameType } from '~actions';
import store, { addGameType } from '~store';

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
};

import log from '../log';
import store, {
  addQueryServer,
  removeQueryServer,
  editQueryServer,
} from '~store';
import {
  addGuildQueryServer,
  removeGuildQueryServer,
  editGuildQueryServerAddress,
  editGuildQueryServerName,
} from '~actions';
import { formatQueryServers } from '../formatting';

export const handleShowServers: Handler = async (message) => {
  log.info(`Entering handleShowServers`);
  const { guild } = message;
  if (!guild) return;

  const cache = store.getState();
  const { list } = cache.queries[guild.id];

  const sortedList = list.slice().sort((a, b) => a.id - b.id);

  message.channel.send(formatQueryServers(sortedList));
  log.info(`Exiting handleShowServers`);
};

export const handleAddQueryServer: Handler = async (message, args) => {
  log.info(`Entering handleAddQueryServer`);
  const { guild } = message;
  if (!guild) return;

  const [address, ...serverName] = args;
  const name = serverName.join(' ');

  if (!address || !name) {
    message.channel.send(
      `Invalid usage of command. Missing server or server name`
    );
    return;
  }

  const id = Date.now();
  await addGuildQueryServer(guild.id, {
    id,
    name,
    address,
  });
  log.info(`Added query server ${address} at guild ${guild.id}`);

  store.dispatch(
    addQueryServer({
      guildId: guild.id,
      id,
      name,
      address,
    })
  );
  message.channel.send(`Query server added`);
  log.info(`Exiting handleAddQueryServer`);
};

export const handleDeleteQueryServer: Handler = async (message, args) => {
  log.info(`Entering handleDeleteQueryServer`);
  const { guild } = message;
  if (!guild) return;

  const cache = store.getState();
  const { list } = cache.queries[guild.id];

  const originalIndex = Number(args[0]);
  const index = originalIndex - 1;
  const queryServer = list[index];
  if (isNaN(index) || queryServer === undefined) {
    message.channel.send(
      `There was no query server to be found at ${originalIndex}`
    );
    return;
  }

  await removeGuildQueryServer(guild.id, queryServer.id);
  log.info(`Deleted query server index ${index} at guild ${guild.id}`);

  store.dispatch(removeQueryServer({ guildId: guild.id, index }));

  message.channel.send(`Query server removed`);
  log.info(`Exiting handleDeleteQueryServer`);
};

export const handleEditQueryServer: Handler = async (message, args) => {
  log.info(`Entering handleEditQueryServer`);
  const { guild } = message;
  if (!guild) return;

  const cache = store.getState();
  const { list } = cache.queries[guild.id];

  const [idx, attribute, ...rest] = args;
  const index = Number(idx) - 1;
  const queryServer = list[index];
  if (isNaN(index) || queryServer === undefined) {
    message.channel.send(`There was no query server to be found at ${idx}`);
    return;
  }

  const value = rest.join(' ');
  if (attribute === 'name') {
    await editGuildQueryServerName(guild.id, queryServer.id, value);
    log.info(`Edited name of query server to ${value} at guild ${guild.id}`);
  } else if (attribute === 'address') {
    await editGuildQueryServerAddress(guild.id, queryServer.id, value);
    log.info(`Edited address of query server to ${value} at guild ${guild.id}`);
  } else {
    message.channel.send(`${attribute} is not a valid attribute`);
    return;
  }

  store.dispatch(
    editQueryServer({ guildId: guild.id, id: queryServer.id, attribute, value })
  );

  message.channel.send(`Query server edited`);
  log.info(`Exiting handleEditQueryServer`);
};

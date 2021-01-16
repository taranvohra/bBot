import log from '../log';
import store, { addQueryServer } from '~store';
import { addGuildQueryServer } from '~actions';
import { formatQueryServers } from '../formatting';

export const handleShowServers: Handler = async (message) => {
  log.info(`Entering handleShowServers`);
  const { guild } = message;
  if (!guild) return;

  const cache = store.getState();
  const { list } = cache.queries[guild.id];

  const sortedList = list.slice().sort((a, b) => a.timestamp - b.timestamp);

  message.channel.send(formatQueryServers(sortedList));
  log.info(`Exiting handleShowServers`);
};

export const handleAddQueryServer: Handler = async (message, args) => {
  log.info(`Entering handleAddQueryServer`);
  const { guild } = message;
  if (!guild) return;

  const [server, ...serverName] = args;
  const name = serverName.join(' ');

  if (!server || !name) {
    message.channel.send(
      `Invalid usage of command. Missing server or server name`
    );
    return;
  }

  const timestamp = Date.now();
  await addGuildQueryServer(guild.id, {
    name,
    server,
    timestamp,
  });
  log.info(`Added query server ${server} at guild ${guild.id}`);

  store.dispatch(
    addQueryServer({
      guildId: guild.id,
      name,
      server,
      timestamp,
    })
  );
  message.channel.send(`Query server added`);
  log.info(`Exiting handleAddQueryServer`);
};

import log from '../log';
import store from '~store';
import { formatQueryServers } from '../formatting';

export const handleShowServers: Handler = async (message) => {
  log.info(`Entering handleShowServers`);
  const { guild } = message;
  if (!guild) return;

  const cache = store.getState();
  const { list } = cache.queries[guild.id];

  const sortedList = list
    .slice()
    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  message.channel.send(formatQueryServers(sortedList));
  log.info(`Exiting handleShowServers`);
};

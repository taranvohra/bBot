import dgram from 'dgram';
import log from '../log';
import store, {
  addQueryServer,
  removeQueryServer,
  editQueryServer,
} from '~/store';
import {
  addGuildQueryServer,
  removeGuildQueryServer,
  editGuildQueryServerAddress,
  editGuildQueryServerName,
} from '~/actions';
import { getHostPortPasswordFromAddress, fizzZoop } from '~/utils';
import { formatQueryServers, formatQueryServerStatus } from '../formatting';
import geoip from 'geoip-country';

interface UTQuery {
  data: string;
  address: string;
}

const queryUT99Server = (host: string, port: number): Promise<UTQuery> =>
  new Promise((rs, rj) => {
    try {
      let address = ``;
      let data = ``;
      const socket = dgram.createSocket('udp4');
      const queryDatagram = '\\status\\XServerQuery';

      const handleComplete = () => {
        clearTimeout(id);
        rs({ data, address });
        socket.close();
      };

      const handleFailed = () => {
        clearTimeout(id);
        rj(null);
      };

      // udp port is +1
      socket.send(queryDatagram, port + 1, host);

      socket.on('error', handleFailed);

      socket.on('message', (message, rinfo) => {
        const unicodeValues = message.toJSON().data;
        const unicodeString = String.fromCharCode(...unicodeValues);

        data += unicodeString;
        address = rinfo.address;

        if (unicodeString.split('\\').some((s) => s === 'final'))
          handleComplete();
      });

      let id = setTimeout(() => {
        data ? handleComplete() : handleFailed();
      }, 1000);
    } catch (error) {
      rj(error);
    }
  });

const parseServerResponse = (response: string) => {
  const queryData = response.split('\\');
  queryData.shift();
  queryData.unshift();

  const { info: infoArr, players: playersArr } = queryData.reduce(
    (acc, curr) => {
      if (curr === 'player_0' || curr === 'Player_0')
        acc.foundPlayerData = true;
      acc.foundPlayerData ? acc.players.push(curr) : acc.info.push(curr);
      return acc;
    },
    {
      info: [],
      players: [],
      foundPlayerData: false,
    } as { info: string[]; players: string[]; foundPlayerData: boolean }
  );

  return { info: fizzZoop(infoArr), players: fizzZoop(playersArr) };
};

export const handleShowServers: Handler = async (message) => {
  log.info(`Entering handleShowServers`);
  const { guild } = message;
  if (!guild) return;

  const cache = store.getState();
  const queries = cache.queries[guild.id];
  if (!queries) return;

  const { list } = queries;

  const sortedList = list.slice().sort((a, b) => a.id - b.id);

  const listResponses = await Promise.allSettled(
    sortedList.map(({ address }) => {
      const { host, port } = getHostPortPasswordFromAddress(address);
      return queryUT99Server(host, port);
    })
  ).catch(() => {});

  if (!listResponses) return;

  const parsedResponses = listResponses.map((r) => {
    if (r.status === 'fulfilled') return parseServerResponse(r.value.data);
  });

  const formattedResponse = formatQueryServers(sortedList, parsedResponses);

  message.channel.send({ embeds: [formattedResponse] });
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
  const queries = cache.queries[guild.id];
  if (!queries) return;

  const { list } = queries;

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
  const queries = cache.queries[guild.id];
  if (!queries) return;

  const { list } = queries;

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

export const handleQueryServer: Handler = async (message, args) => {
  log.info(`Entering handleQueryServer`);
  const { guild } = message;
  if (!guild) return;

  const cache = store.getState();
  const queries = cache.queries[guild.id];
  if (!queries) return;

  const { list } = queries;

  const queryServerFromIndex = list[Number(args[0]) - 1];

  // The arg can be either the index or a custom address
  // We lookup in our cache list to see if it's a valid index
  // If not then we consider it to be a custom address

  const { host, port, password } = queryServerFromIndex
    ? getHostPortPasswordFromAddress(queryServerFromIndex.address)
    : getHostPortPasswordFromAddress(args[0]);

  if (!host) {
    message.channel.send(`No host found to query`);
    return;
  }

  const response = await queryUT99Server(host, port);

  const { info, players } = parseServerResponse(response.data);
  const geo = geoip.lookup(response.address);
  const country = geo ? geo.country.toLowerCase() : '';

  const formattedResponse = formatQueryServerStatus(info, players, {
    host,
    port,
    password,
    country,
  });

  message.channel.send({ embeds: [formattedResponse] });
  log.info(`Exiting handleQueryServer`);
};

export const handleShowIp: Handler = async (message, args) => {
  log.info(`Entering handleShowIp`);
  const { guild, cmd } = message;
  if (!guild || !cmd) return;

  const cache = store.getState();
  const queries = cache.queries[guild.id];
  if (!queries) return;

  const { list } = queries;

  const matchedIndex = args[0] ? [args[0]] : cmd.match(/\d/g);
  if (!matchedIndex) return;

  const index = parseInt(matchedIndex.join(''));
  const queryServer = list[index - 1];
  if (!queryServer) {
    message.channel.send(`No query server at ${index}`);
    return;
  }

  const { host, port, password } = getHostPortPasswordFromAddress(
    queryServer.address
  );
  message.channel.send(
    `<unreal://${host}:${port}${password ? `?password=${password}` : ''}>`
  );
  log.info(`Exiting handleShowIp`);
};

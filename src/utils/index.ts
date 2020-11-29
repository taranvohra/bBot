import { GuildMember } from 'discord.js';
import store from '~store';

export const CONSTANTS = {
  defaultPrefix: '-',
  privilegedRoles: ['bBot'],
  teamIndexes: {
    red: 0,
    blue: 1,
    green: 2,
    gold: 3,
  },
  teams: {
    team_0: 'Red Team',
    team_1: 'Blue Team',
    team_2: 'Green Team',
    team_3: 'Gold Team',
    team_255: 'Players',
    spec: 'Spectators',
  },
  tagLength: 50,
  autoCaptainPickTimer: 30_000,
  strongPlayersRatingThreshold: 3.75,
};

export const isGuildRegistered = (guildId: string) => {
  const cache = store.getState();
  return cache.misc[guildId] !== undefined;
};

export const isMemberPrivileged = (member: GuildMember) =>
  member.roles.cache.some((role) =>
    CONSTANTS.privilegedRoles.includes(role.name)
  );

export const isCommandInValidChannel = (
  command: Command,
  guildId: string,
  channelId: string
): { valid: boolean; reason: string | undefined } => {
  const cache = store.getState();
  const pugChannel = cache.pugs[guildId].channel;
  const queriesChannel = cache.queries[guildId].channel;
  switch (command.group) {
    case 'general':
      return { valid: true, reason: '' };

    case 'pugs':
      return pugChannel
        ? pugChannel === channelId
          ? { valid: true, reason: '' }
          : { valid: false, reason: pugChannel }
        : { valid: false, reason: undefined };

    case 'queries':
      return queriesChannel
        ? queriesChannel === channelId
          ? { valid: true, reason: '' }
          : { valid: false, reason: queriesChannel }
        : { valid: false, reason: undefined };
  }
};

export const computePickingOrder = (noOfPlayers: number, noOfTeams: number) => {
  let idx = 0,
    remainingPlayers = noOfPlayers - noOfTeams, // because captains
    pickingOrder: Array<number> = [],
    wholeRound: Array<number> = [];

  if (noOfPlayers < noOfTeams || noOfPlayers % noOfTeams !== 0) return null; // Invalid, cannot compute from these params

  if (noOfPlayers === noOfTeams) return [-1]; // 1v1, requires no picking order

  while (remainingPlayers > 0) {
    pickingOrder.push(idx);
    wholeRound.push(idx);
    if (
      wholeRound.length === noOfTeams &&
      pickingOrder.length !== noOfPlayers - noOfTeams
    ) {
      pickingOrder = [...pickingOrder, ...wholeRound.reverse()];
      wholeRound = [];
      idx = 0;
      remainingPlayers = remainingPlayers - noOfTeams - 1;
    } else {
      idx++;
      remainingPlayers--;
    }
  }
  return pickingOrder;
};

export const getRandomInt = (min: number, max: number) =>
  Math.floor(Math.random() * (Math.floor(max) - Math.ceil(min) + 1)) +
  Math.ceil(min);

export const shuffle = <T>(arr: Array<T>): Array<T> =>
  arr.slice().sort(() => Math.random() - 0.5);

export const emojis = {
  tearddy: '<:tearddy:601092340865564673>',
  smart: '<:smart:601094351770353664>',
  peepoComfy: '<:peepoComfy:626060643895607296>',
};

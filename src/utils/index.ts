import { GuildMember } from 'discord.js';
import { PugPlayer } from '~models';
import store from '~store';

export const CONSTANTS = {
  defaultPrefix: '.',
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
  coolDownSeconds: 120,
  commandGroups: ['pugs', 'queries'],
};

export const isGuildRegistered = (guildId: string) => {
  const cache = store.getState();
  return cache.misc[guildId] !== undefined;
};

export const isMemberPrivileged = (member: GuildMember) =>
  member.roles.cache.some((role) =>
    CONSTANTS.privilegedRoles.includes(role.name)
  );

export const isDuelPug = (pickingOrder: Array<number>) =>
  pickingOrder.length === 1 && pickingOrder[0] === -1;

export const isCommandInValidChannel = (
  command: Command,
  guildId: string,
  channelId: string
): { valid: boolean; reason: string | undefined } => {
  const cache = store.getState();
  switch (command.group) {
    case 'general':
      return { valid: true, reason: '' };

    case 'pugs':
      const pugChannel = cache.pugs[guildId].channel;
      return pugChannel
        ? pugChannel === channelId
          ? { valid: true, reason: '' }
          : { valid: false, reason: pugChannel }
        : { valid: false, reason: undefined };

    case 'queries':
      const queriesChannel = cache.queries[guildId].channel;
      return queriesChannel
        ? queriesChannel === channelId
          ? { valid: true, reason: '' }
          : { valid: false, reason: queriesChannel }
        : { valid: false, reason: undefined };
  }
};

export const isCommandGroupIgnored = (guildId: string, group: string) => {
  const cache = store.getState();
  const { ignoredCommandGroup } = cache.misc[guildId];
  return ignoredCommandGroup.includes(group);
};

export const computePickingOrder = (
  noOfPlayers: number,
  noOfTeams: number,
  isMix: boolean
) => {
  let idx = 0,
    remainingPlayers = noOfPlayers - noOfTeams, // because captains
    pickingOrder: Array<number> = [],
    wholeRound: Array<number> = [];

  if (isMix) return []; // No picking order for mix

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

export const sanitizeName = (name: string) =>
  name.replace(/(\*|`|:|_|~|\|)/g, (c) => `\\${c}`);

export const emojis = {
  moskva: '<:moskva:610047429634686976>',
  tearddy: '<:tearddy:601092340865564673>',
  smart: '<:smart:601094351770353664>',
  peepoComfy: '<:peepoComfy:626060643895607296>',
  bannechu: '<:bannechu:601092624962682881>',
  pupcurn: '<a:pupcurn:610049697402454016>',
  residentsleeper: '<:residentsleeper:601092229343215646>',
  crinj: '<:crinj:803669994646011924>',
  yobro: '<a:yobro:803671837052502027>',
};

export const teamEmojis = {
  team_0: '<:AGONY:610820370617991198>',
  team_1: '<:FROSTAGONY:610820381778903052>',
  team_2: '<:DISGUSTAGONY:610820391786774546>',
  team_3: '<:GOLDENAGONY:610826861165150221>',
  team_255: '',
  spec: '',
};

export const teams = {
  team_0: 'Red Team',
  team_1: 'Blue Team',
  team_2: 'Green Team',
  team_3: 'Gold Team',
  team_255: 'Players',
  spec: 'Spectators',
};

export const isCommandConstraintSatified = (command: Command, cmd: string) =>
  command.rgx
    ? command.aliases.some((a) => command.rgx!(a).test(cmd))
    : command.aliases.includes(cmd);

export const calculateBlockExpiry = (
  period: 'm' | 'h' | 'd',
  length: number
) => {
  const expiry = new Date();
  if (period === 'm') expiry.setMinutes(expiry.getMinutes() + length);
  else if (period === 'h') expiry.setHours(expiry.getHours() + length);
  else expiry.setHours(expiry.getHours() + length * 24);
  return expiry;
};

export const getHostPortPasswordFromAddress = (
  address: string
): { host: string; port: number; password: string } => {
  const [stringAfterProtocol] = address.split('unreal://').filter(Boolean);
  const [
    stringBeforePassword,
    stringAfterPassword = '',
  ] = stringAfterProtocol.split('?');
  const [hostString, portString] = stringBeforePassword.split(':');
  const [, password] = stringAfterPassword.split('=');
  return {
    host: hostString,
    port: Number(portString) || 7777,
    password,
  };
};

export const fizzZoop = <T>(array: T[]) =>
  array.reduce((acc, curr, i, arr) => {
    if (i % 2 === 0) {
      const item = ((curr as unknown) as string).toLowerCase();
      acc[item] = arr[i + 1];
    }
    return acc;
  }, {} as { [key: string]: T });

export const getTeamNumericIndex = (teamName: string) =>
  Object.values(teams).findIndex((t) => t === teamName);

export const getRandomPickIndex = (players: Array<PugPlayer>) => {
  const indexes = players.reduce((acc, curr, i) => {
    if (curr.team === null && curr.pick === null) acc.push(i);
    return acc;
  }, [] as number[]);

  return shuffle(indexes)[0];
};

export const secondsToHH_MM_SS = (seconds: number) =>
  new Date(seconds * 1000).toISOString().substr(11, 8);

export const powerSet = <T>(array: T[]) => {
  const subsets = [];
  const setSize = array.length;
  const powerSetSize = 2 ** setSize;
  for (let i = 0; i < powerSetSize; i++) {
    const temp = [];
    for (let j = 0; j < setSize; j++) {
      if (i & (1 << j)) temp.push(array[j]);
    }
    subsets.push(temp);
  }
  return subsets;
};

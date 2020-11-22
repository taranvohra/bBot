import { GuildMember } from 'discord.js';

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
  autoCaptainPickTimer: 30 * 1000,
};

export const isMemberPrivileged = (member: GuildMember) =>
  member.roles.cache.some((role) =>
    CONSTANTS.privilegedRoles.includes(role.name)
  );

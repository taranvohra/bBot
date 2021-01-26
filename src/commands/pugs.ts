const group = 'pugs';
const pugsCommandList: Command[] = [
  {
    group,
    key: 'handleAddGameType',
    aliases: ['addgametype', 'agm'],
    type: 'args',
    isPrivileged: true,
    needsRegisteredGuild: true,
  },
  {
    group,
    key: 'handleDeleteGameType',
    aliases: ['deletegametype', 'dgm'],
    type: 'args',
    isPrivileged: true,
    needsRegisteredGuild: true,
  },
  {
    group,
    key: 'handleDecideDefaultOrSpecificJoin',
    aliases: ['j', 'join'],
    type: 'both',
    isPrivileged: false,
    needsRegisteredGuild: true,
  },
  {
    group,
    key: 'handleSetDefaultJoin',
    aliases: ['defaultjoin'],
    type: 'args',
    isPrivileged: false,
    needsRegisteredGuild: true,
  },

  {
    group,
    key: 'handleLeaveGameTypes',
    aliases: ['l', 'lv', 'leave'],
    type: 'both',
    isPrivileged: false,
    needsRegisteredGuild: true,
  },
  {
    group,
    key: 'handleLeaveAllGameTypes',
    aliases: ['lva'],
    type: 'solo',
    isPrivileged: false,
    needsRegisteredGuild: true,
  },
  {
    group,
    key: 'handleListGameTypes',
    aliases: ['ls', 'list'],
    type: 'both',
    isPrivileged: false,
    needsRegisteredGuild: true,
  },
  {
    group,
    key: 'handleListAllCurrentGameTypes',
    aliases: ['lsa'],
    type: 'solo',
    isPrivileged: false,
    needsRegisteredGuild: true,
  },
  {
    group,
    key: 'handleAddCaptain',
    aliases: ['captain', 'capt'],
    type: 'solo',
    isPrivileged: false,
    needsRegisteredGuild: true,
  },
  {
    group,
    key: 'handlePickPlayer',
    aliases: ['pick'],
    type: 'args',
    isPrivileged: false,
    needsRegisteredGuild: true,
  },
  {
    group,
    key: 'handlePugPicking',
    aliases: ['picking'],
    type: 'solo',
    isPrivileged: false,
    needsRegisteredGuild: true,
  },
  {
    group,
    key: 'handleAddOrRemoveTag',
    aliases: ['tag'],
    type: 'both',
    isPrivileged: false,
    needsRegisteredGuild: true,
  },
  {
    group,
    key: 'handleCheckStats',
    aliases: ['stats'],
    type: 'both',
    isPrivileged: false,
    needsRegisteredGuild: true,
  },
  {
    group,
    key: 'handleCheckLastPugs',
    aliases: ['last'],
    rgx: (cmd: string) => new RegExp(`^${cmd}(\d|t)*`, 'g'),
    type: 'both',
    isPrivileged: false,
    needsRegisteredGuild: true,
  },
  {
    group,
    key: 'handlePromoteAvailablePugs',
    aliases: ['promote'],
    type: 'both',
    isPrivileged: false,
    needsRegisteredGuild: true,
  },
  {
    group,
    key: 'handleDecidePromoteOrPick',
    aliases: ['p'],
    type: 'both',
    isPrivileged: false,
    needsRegisteredGuild: true,
  },
  {
    group,
    key: 'handleShowTop10Played',
    aliases: ['top10played'],
    type: 'args',
    isPrivileged: false,
    needsRegisteredGuild: true,
  },
  {
    group,
    key: 'handleAdminAddPlayer',
    aliases: ['add'],
    type: 'args',
    isPrivileged: true,
    needsRegisteredGuild: true,
  },
  {
    group,
    key: 'handleAdminRemovePlayer',
    aliases: ['remove'],
    type: 'args',
    isPrivileged: true,
    needsRegisteredGuild: true,
  },
  {
    group,
    key: 'handleAdminPickPlayer',
    aliases: ['forcepick'],
    type: 'args',
    isPrivileged: true,
    needsRegisteredGuild: true,
  },
  {
    group,
    key: 'handleAdminBlockPlayer',
    aliases: ['block'],
    type: 'args',
    isPrivileged: true,
    needsRegisteredGuild: true,
  },
  {
    group,
    key: 'handleAdminUnblockPlayer',
    aliases: ['unblock'],
    type: 'args',
    isPrivileged: true,
    needsRegisteredGuild: true,
  },
  {
    group,
    key: 'handleAdminShowBlockedPlayers',
    aliases: ['showblocked'],
    type: 'solo',
    isPrivileged: true,
    needsRegisteredGuild: true,
  },
  {
    group,
    key: 'handleAdminEnableMapvoteCoinFlip',
    aliases: ['enablecoinflip'],
    type: 'args',
    isPrivileged: true,
    needsRegisteredGuild: true,
  },
  {
    group,
    key: 'handleAdminDisableMapvoteCoinFlip',
    aliases: ['disablecoinflip'],
    type: 'args',
    isPrivileged: true,
    needsRegisteredGuild: true,
  },
];

export default pugsCommandList;

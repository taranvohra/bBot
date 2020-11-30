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
    key: 'handleJoinGameTypes',
    aliases: ['j', 'join'],
    type: 'both',
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
];

export default pugsCommandList;

const group = 'pugs';
const pugsCommandList: Command[] = [
  {
    group,
    key: 'handleAddGameType',
    aliases: ['addgametype', 'agm'],
    type: 'multiArg',
    isPrivileged: true,
    needsRegisteredGuild: true,
  },
  {
    group,
    key: 'handleDeleteGameType',
    aliases: ['deletegametype', 'dgm'],
    type: 'singleArg',
    isPrivileged: true,
    needsRegisteredGuild: true,
  },
];

export default pugsCommandList;

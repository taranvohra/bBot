const group = 'queries';
const queryCommandList: Command[] = [
  {
    group,
    key: 'handleShowServers',
    aliases: ['server', 'servers'],
    type: 'solo',
    isPrivileged: false,
    needsRegisteredGuild: true,
  },
  {
    group,
    key: 'handleAddQueryServer',
    aliases: ['addqueryserver', 'aqs'],
    type: 'args',
    isPrivileged: true,
    needsRegisteredGuild: true,
  },
];

export default queryCommandList;

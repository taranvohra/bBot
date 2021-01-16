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
];

export default queryCommandList;

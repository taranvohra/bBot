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
  {
    group,
    key: 'handleDeleteQueryServer',
    aliases: ['delqueryserver', 'dqs'],
    type: 'args',
    isPrivileged: true,
    needsRegisteredGuild: true,
  },
  {
    group,
    key: 'handleEditQueryServer',
    aliases: ['editqueryserver', 'eqs'],
    type: 'args',
    isPrivileged: true,
    needsRegisteredGuild: true,
  },
  {
    group,
    key: 'handleQueryServer',
    aliases: ['q', 'query'],
    type: 'args',
    isPrivileged: false,
    needsRegisteredGuild: true,
  },
  {
    group,
    key: 'handleShowIp',
    aliases: ['ip'],
    type: 'both',
    rgx: () => /^ip\s{0,1}/g,
    isPrivileged: false,
    needsRegisteredGuild: true,
  },
];

export default queryCommandList;

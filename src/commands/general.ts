const group = 'general';
const generalCommandList: Command[] = [
  {
    group,
    key: 'handleRegisterServer',
    aliases: ['register'],
    type: 'noArg',
    isPrivileged: true,
    needsRegisteredGuild: false,
  },
  {
    group,
    key: 'handleSetPugChannel',
    aliases: ['setpugchannel'],
    type: 'noArg',
    isPrivileged: true,
    needsRegisteredGuild: true,
  },
  {
    group,
    key: 'handleSetQueryChannel',
    aliases: ['setquerychannel'],
    type: 'noArg',
    isPrivileged: true,
    needsRegisteredGuild: true,
  },
  {
    group,
    key: 'handleSetPrefix',
    aliases: ['setprefix'],
    type: 'singleArg',
    isPrivileged: true,
    needsRegisteredGuild: true,
  },
  {
    group,
    key: 'handleIgnoreCommandGroup',
    aliases: ['ignorecommandgroup', 'igc'],
    type: 'singleArg',
    isPrivileged: true,
    needsRegisteredGuild: true,
  },
  {
    group,
    key: 'handleUnIgnoreCommandGroup',
    aliases: ['unignorecommandgroup', 'uigc'],
    type: 'singleArg',
    isPrivileged: true,
    needsRegisteredGuild: true,
  },
];

export default generalCommandList;

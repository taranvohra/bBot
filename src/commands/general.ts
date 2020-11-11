const group = 'general';
const generalCommandList: Command[] = [
  {
    group,
    key: 'handleRegisterServer',
    aliases: ['register'],
    type: 'noArg',
    isPrivileged: true,
  },
  {
    group,
    key: 'handleSetPugChannel',
    aliases: ['setpugchannel'],
    type: 'noArg',
    isPrivileged: true,
  },
  {
    group,
    key: 'handleSetQueryChannel',
    aliases: ['setquerychannel'],
    type: 'noArg',
    isPrivileged: true,
  },
];

export default generalCommandList;

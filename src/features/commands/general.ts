const group = 'general';
const generalCommandList: Command[] = [
  { group, key: 'handleRegisterServer', aliases: ['register'], type: 'solo' },
  {
    group,
    key: 'handleSetPugChannel',
    aliases: ['setpugchannel'],
    type: 'solo',
  },
  {
    group,
    key: 'handleSetQueryChannel',
    aliases: ['setquerychannel'],
    type: 'solo',
  },
];

export default generalCommandList;

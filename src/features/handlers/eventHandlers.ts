import { Message, Client } from 'discord.js';

import { CONSTANTS } from '~utils';

export const onMessage = async (message: Message, client: Client) => {
  const { author, content, guild } = message;
  if (author.id === client.user?.id) return;

  const prefix = CONSTANTS.defaultPrefix; // TODO add option to pick guild specific prefix
  if (!content.startsWith(prefix)) return;

  if (!guild?.id) return;

  const argsArr = content.substring(prefix.length).split(' ');
  if (argsArr.length === 0) return;

  const [action, ...args] = argsArr;
};

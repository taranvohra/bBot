import { Message, Client } from 'discord.js';
import { CONSTANTS, isMemberPrivileged } from '~utils';
import commandHandlers from './commandHandlers';
import commands from '../commands';

export const onMessage = async (message: Message, client: Client) => {
  const { author, content, guild, member } = message;

  if (author.id === client.user?.id) return;
  if (!guild) return;
  if (!member) return;

  const prefix = CONSTANTS.defaultPrefix; // TODO add option to pick guild specific prefix
  if (!content.startsWith(prefix)) return;

  const argsArr = content.substring(prefix.length).split(' ');
  if (argsArr.length === 0) return;

  const [cmd, ...args] = argsArr;
  const type =
    args.length === 0 ? 'noArg' : args.length === 1 ? 'singleArg' : 'multiArg';

  const foundCommand = commands.find(
    (command) => command.type === type && command.aliases.includes(cmd)
  );

  if (foundCommand) {
    if (foundCommand.isPrivileged && !isMemberPrivileged(member)) {
      message.channel.send(
        `This is a privileged command! You do not have the appropriate role to use this command`
      );
    }

    const handler = foundCommand.key as keyof typeof commandHandlers;
    commandHandlers[handler](message, args);
  } else {
    // TODO send a mesage telling the user type help for list of commands
  }
};

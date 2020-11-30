import { Message, Client } from 'discord.js';
import {
  CONSTANTS,
  isMemberPrivileged,
  isGuildRegistered,
  isCommandInValidChannel,
} from '~utils';
import commands from '../commands';
import * as generalHandlers from './generalHandlers';
import * as pugHandlers from './pugHandlers';

const commandHandlers = { ...generalHandlers, ...pugHandlers };

export const onMessage = async (message: Message, client: Client) => {
  const { author, content, guild, member, channel } = message;

  if (author.id === client.user?.id) return;
  if (!guild) return;
  if (!member) return;

  const prefix = CONSTANTS.defaultPrefix; // TODO add option to pick guild specific prefix
  if (!content.startsWith(prefix)) return;

  const argsArr = content.substring(prefix.length).split(' ');
  if (argsArr.length === 0) return;

  const [cmd, ...args] = argsArr;
  const type = args.length === 0 ? 'solo' : 'args';

  const foundCommand = commands.find((command) => {
    if (command.type === 'both') return command.aliases.includes(cmd);
    else return command.type === type && command.aliases.includes(cmd);
  });

  if (foundCommand) {
    if (foundCommand.needsRegisteredGuild && !isGuildRegistered(guild.id)) {
      message.channel.send(
        `Please register this guild before using any of the other commands`
      );
      return;
    }

    const { valid, reason } = isCommandInValidChannel(
      foundCommand,
      guild.id,
      channel.id
    );

    if (!valid) {
      if (reason === undefined) {
        message.channel.send(
          `Active channel for ${foundCommand.group} is not present`
        );
      } else {
        message.channel.send(
          `Active channel for ${foundCommand.group} is <#${reason}>`
        );
      }
      return;
    }

    if (foundCommand.isPrivileged && !isMemberPrivileged(member)) {
      message.channel.send(
        `This is a privileged command. You do not have the appropriate role to use this command.`
      );
      return;
    }

    const handler = foundCommand.key as keyof typeof commandHandlers;
    commandHandlers[handler](message, args, member.user);
  } else {
    // TODO send a mesage telling the user type help for list of commands
  }
};

import {
  Message,
  Presence,
  GuildMember,
  PartialGuildMember,
  TextChannel,
} from 'discord.js';
import store from '~/store';
import {
  CONSTANTS,
  isMemberPrivileged,
  isGuildRegistered,
  isCommandInValidChannel,
  sanitizeName,
  isCommandConstraintSatified,
  isCommandGroupIgnored,
} from '~/utils';
import commands from '../commands';
import * as generalHandlers from './generalHandlers';
import * as pugHandlers from './pugHandlers';
import * as queryHandlers from './queryHandlers';

export const commandHandlers = {
  ...generalHandlers,
  ...pugHandlers,
  ...queryHandlers,
};

export const onMessage = async (message: Message) => {
  const { author, content, guild, member, channel, client } = message;

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
    if (command.type === 'both')
      return isCommandConstraintSatified(command, cmd);
    else
      return command.type === type && isCommandConstraintSatified(command, cmd);
  });

  if (foundCommand) {
    if (isCommandGroupIgnored(guild.id, foundCommand.group)) return;

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

    message.author.username = sanitizeName(message.author.username);
    message.cmd = cmd;

    const handler = foundCommand.key as keyof typeof commandHandlers;
    commandHandlers[handler](message, args.filter(Boolean));
  } else {
    // TODO send a mesage telling the user type help for list of commands
  }
};

export const onPresenceUpdate = async (
  _: Presence | undefined,
  after: Presence
) => {
  const { user, status, guild } = after;
  if (status === 'offline') {
    if (!guild || !user) return;
    const cache = store.getState();
    const { channel: pugChannel, list } = cache.pugs[guild.id];
    if (!pugChannel) return;

    list.forEach((pug) => {
      const isInPug = pug.players.find((p) => p.id === user?.id);
      if (isInPug) {
        const channel = guild.channels.cache.get(pugChannel);
        if (!channel) return;
        const message = {
          guild,
          content: 'zzz',
          author: {
            id: user.id,
            username: user.username,
          },
          channel,
        };
        commandHandlers['handleLeaveAllGameTypes'](message as Message, []);
      }
    });
  }
};

export const onGuildMemberRemove = (
  member: GuildMember | PartialGuildMember
) => {
  const { guild, user } = member;
  const cache = store.getState();
  const { channel: pugChannel, list } = cache.pugs[guild.id];
  if (!pugChannel || !user) return;

  list.forEach((pug) => {
    const isInPug = pug.players.find((p) => p.id === user.id);
    if (isInPug) {
      const channel = guild.channels.cache.get(pugChannel);
      if (!channel) return;
      const message = {
        guild,
        content: 'left',
        author: {
          id: user.id,
          username: user.username,
        },
        channel,
      };
      commandHandlers['handleLeaveAllGameTypes'](message as Message, []);
    }
  });
};

export const onGuildMemberUpdate = (
  prev: GuildMember | PartialGuildMember,
  updated: GuildMember
) => {
  const { roles: prevRoles } = prev;
  const {
    roles: newRoles,
    guild,
    user: { id },
  } = updated;

  const cache = store.getState();
  const { channel: channelId } = cache.pugs[guild.id];

  if (!channelId) return;

  const hadCooldownRoleBefore = prevRoles.cache.some(
    (role) => role.name === 'COOLDOWN'
  );
  const hasCooldownRoleNow = newRoles.cache.some(
    (role) => role.name === 'COOLDOWN'
  );

  const channel = guild.channels.cache.get(channelId);
  if (channel) {
    let textChannel = channel as TextChannel;
    if (!hadCooldownRoleBefore && hasCooldownRoleNow) {
      textChannel.send(
        `<@${id}>, you have been given the \`COOLDOWN\` role. This is because the staff feel you spam certain bot commands alot. The following commands are part of this restriction:-\n
        **- Promote**\n\nThis means you & other members part of this restriction will be able to use the aforementioned command(s) \`once\` every ${CONSTANTS.coolDownSeconds} seconds.
        `
      );
    } else if (hadCooldownRoleBefore && !hasCooldownRoleNow) {
      textChannel.send(
        `<@${id}>, the \`COOLDOWN\` restriction has been lifted up by the staff. Ensure it doesn't happen again.`
      );
    }
  }
};

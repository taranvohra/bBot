import { Message, Client, User } from 'discord.js';
import { Pug } from '~models';

declare global {
  export type Command = {
    group: 'general' | 'pugs' | 'queries';
    type: 'solo' | 'args' | 'both';
    key: string;
    aliases: string[];
    isPrivileged: boolean;
    needsRegisteredGuild: boolean;
  };

  export type Handler = (
    message: Message,
    args: string[],
    mentionedUser?: User,
    returnMsg?: boolean
  ) => Promise<string | void>;

  export type WithGuildID = {
    guildId: string;
  };

  export type JoinStatus = {
    name: string;
    result: 'full' | 'present' | 'joined' | 'not-found';
    user?: User;
    pug?: Pug;
  };

  export type LeaveStatus = {
    name: string;
    result: 'not-in' | 'left' | 'not-found';
    user?: User;
    pug?: Pug;
  };
}

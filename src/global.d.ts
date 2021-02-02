import { Message, Client, User } from 'discord.js';
import { Pug } from '~/models';

declare module 'discord.js' {
  interface Message {
    cmd?: string;
  }
}

declare global {
  export type Command = {
    group: 'general' | 'pugs' | 'queries';
    type: 'solo' | 'args' | 'both';
    key: string;
    aliases: string[];
    rgx?: (arg: string) => RegExp;
    isPrivileged: boolean;
    needsRegisteredGuild: boolean;
  };

  export type Handler = (
    message: Message,
    args: string[],
    customMentionedUser?: User,
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

  export type TeamEmojis = 'agonies' | 'cores' | 'logos';
}

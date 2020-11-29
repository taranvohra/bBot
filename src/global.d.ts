import { Message, Client, User } from 'discord.js';
import { Pug } from '~models';

declare global {
  export type Command = {
    group: 'general' | 'pugs' | 'queries';
    key: string;
    aliases: string[];
    type: 'noArg' | 'singleArg' | 'multiArg';
    isPrivileged: boolean;
    needsRegisteredGuild: boolean;
  };

  export type Handler = (
    message: Message,
    args: string[],
    user: User
  ) => Promise<void>;

  export type WithGuildID = {
    guildId: string;
  };

  export type JoinStatus = {
    name: string;
    result: 'full' | 'present' | 'joined' | 'not-found';
    user?: User;
    pug?: Pug;
  };
}

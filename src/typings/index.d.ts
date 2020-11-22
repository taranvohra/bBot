import { Message, Client } from 'discord.js';

declare global {
  //TODO: Add needsRegisteredGuild: boolean
  export type Command = {
    group: string;
    key: string;
    aliases: string[];
    type: 'noArg' | 'singleArg' | 'multiArg';
    isPrivileged: boolean;
  };

  export type Handler = (message: Message, args: string[]) => Promise<void>;
  export type WithGuildID = {
    guildId: string;
  };
}

import { Message, Client, GuildMember } from 'discord.js';

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
    user: GuildMember
  ) => Promise<void>;
  export type WithGuildID = {
    guildId: string;
  };
}

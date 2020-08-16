import { Message, Client } from 'discord.js';

declare global {
  export type Command = {
    group: string;
    key: string;
    aliases: string[];
    type: 'solo' | 'singleArg' | 'multiArg';
  };

  export type Handler = (message: Message, args: string[]) => Promise<void>;
}

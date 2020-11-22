import { Client, Intents } from 'discord.js';
import { onMessage } from '~handlers';
import { connectDB, hydrateStore } from './setup';
import log from './log';

/*
 *  bBot will only receive the following events
 *  https://discord.com/developers/docs/topics/gateway#list-of-intents
 */
const intents = new Intents();
intents.add('GUILDS', 'GUILD_MEMBERS', 'GUILD_PRESENCES', 'GUILD_MESSAGES');
const bBot = new Client({ ws: { intents } });

(async () => {
  try {
    await connectDB();
    log.info(`Connected to database`);

    await hydrateStore();
    log.info(`Hydrated Store`);

    await bBot.login(process.env.DISCORD_BOT_TOKEN);
  } catch (error) {
    console.log(`Error: ${error}`);
  }
})();

/*
 * B O T
 *   E V E N T S
 */
bBot.on('ready', () => {
  // TODO discord channel log
  log.info(`Bot started running at ${new Date().toUTCString()}`);
});

bBot.on('disconnect', () => {});

bBot.on('message', (message) => onMessage(message, bBot));

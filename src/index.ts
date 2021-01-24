import { Client, Intents, TextChannel, Message, User } from 'discord.js';
import { compareAsc } from 'date-fns';
import store from '~store';
import {
  onMessage,
  onPresenceUpdate,
  onGuildMemberRemove,
  onGuildMemberUpdate,
  commandHandlers,
} from '~handlers';
import { connectDB, hydrateStore } from './setup';
import { pugPubSub } from './pubsub';
import { formatBroadcastCaptainsReady } from './formatting';
import log from './log';

/*
 *  bBot will only receive the following events
 *  https://discord.com/developers/docs/topics/gateway#list-of-intents
 */
const intents = new Intents();
intents.add('GUILDS', 'GUILD_MEMBERS', 'GUILD_PRESENCES', 'GUILD_MESSAGES');
const bBot = new Client({ ws: { intents } });

/*
 * B O T
 *   E V E N T S
 */
bBot.on('ready', () => {
  // TODO: discord channel log
  log.info(`Bot started running at ${new Date().toUTCString()}`);
});

bBot.on('disconnect', () => {});

bBot.on('message', onMessage);

bBot.on('presenceUpdate', onPresenceUpdate);

bBot.on('guildMemberRemove', onGuildMemberRemove);

bBot.on('guildMemberUpdate', onGuildMemberUpdate);

pugPubSub.on('captains_ready', (guildId: string, pugName: string) => {
  const cache = store.getState();
  const { channel: channelId, list } = cache.pugs[guildId];
  const pug = list.find((p) => p.name === pugName);
  if (!pug || !channelId) return;

  const channel = bBot.channels.cache.get(channelId) as TextChannel;
  if (channel) {
    channel.send(formatBroadcastCaptainsReady(pug));
  }
});

const monitorUsersForUnblocking = () => {
  setInterval(() => {
    const cache = store.getState();
    Object.entries(cache.blocks).forEach(([guildId, { list }]) => {
      if (list.length > 0) {
        const guild = bBot.guilds.cache.get(guildId);
        if (!guild) return;

        const { channel: channelId } = cache.pugs[guildId];
        if (!channelId) return;

        const channel = guild.channels.cache.get(channelId);
        list.forEach((user) => {
          const message = {
            guild,
            channel,
          } as Message;
          const mentionedUser = {
            ...user.culprit,
          } as User;
          if (compareAsc(new Date(), user.expiresAt) >= 0) {
            commandHandlers['handleAdminUnblockPlayer'](
              message,
              [],
              mentionedUser
            );
          }
        });
      }
    });
    cache.blocks;
  }, 60000);
};

(async () => {
  try {
    await connectDB();
    log.info(`Connected to database`);

    await hydrateStore();
    log.info(`Hydrated Store`);

    await bBot.login(process.env.DISCORD_BOT_TOKEN);
    monitorUsersForUnblocking();
  } catch (error) {
    console.log(`Error: ${error}`);
  }
})();

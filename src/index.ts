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
import { emojis } from '~utils';
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
  const message = `Bot started running at ${new Date().toUTCString()}`;
  log.info(message);
  const HQChannel = bBot.channels.cache.get('559049937560797219');
  if (HQChannel) {
    (HQChannel as TextChannel).send(`\`\`\`\n${message}\`\`\``);
  }
  sendRestartMessageToGuilds();
  monitorUsersForUnblocking();
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

  const channel = bBot.channels.cache.get(channelId);
  if (channel) {
    (channel as TextChannel).send(formatBroadcastCaptainsReady(pug));
  }
});

const sendRestartMessageToGuilds = () => {
  const cache = store.getState();
  bBot.guilds.cache.forEach((guild) => {
    const { channel: pugChannel } = cache.pugs[guild.id];
    const { channel: queryChannel } = cache.queries[guild.id];
    const channelId = pugChannel ? pugChannel : queryChannel;
    if (channelId) {
      const channel = bBot.channels.cache.get(channelId);
      if (channel) {
        (channel as TextChannel).send(`I just restarted ${emojis.yobro}`);
      }
    }
  });
};

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

    bBot.login(process.env.DISCORD_BOT_TOKEN);
  } catch (error) {
    console.log(`Error: ${error}`);
  }
})();

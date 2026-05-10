import config from "./config";
import { Client, GatewayIntentBits, Message, User, Channel } from "discord.js";
import { compareAsc } from "date-fns";
import store from "~/store";
import {
  onMessage,
  onPresenceUpdate,
  onGuildMemberRemove,
  onGuildMemberUpdate,
  commandHandlers,
  onGuildDelete,
} from "~/handlers";
import { emojis } from "~/utils";
import { connectDB, hydrateStore } from "./setup";
import { pugPubSub } from "./pubsub";
import { formatBroadcastCaptainsReady } from "./formatting";
import log from "./log";

/*
 *  bBot will only receive the following events
 *  https://discord.com/developers/docs/topics/gateway#list-of-intents
 */
const bBot = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const sendToTextChannel = (
  channel: Channel | null | undefined,
  content: string,
) => {
  if (channel?.isSendable()) {
    channel.send(content);
  }
};

/*
 * B O T
 *   E V E N T S
 */
bBot.on("ready", () => {
  const message = `Bot started running at ${new Date().toUTCString()}`;
  log.info(message);
  const HQChannel = bBot.channels.cache.get(config.HQ_CHANNEL_ID);
  sendToTextChannel(HQChannel, `\`\`\`\n${message}\`\`\``);
  sendRestartMessageToGuilds();
  monitorUsersForUnblocking();
  monitorForAutoRemovals();
});

bBot.on("disconnect", () => {});

bBot.on("messageCreate", onMessage);

bBot.on("presenceUpdate", onPresenceUpdate);

bBot.on("guildMemberRemove", onGuildMemberRemove);

bBot.on("guildMemberUpdate", onGuildMemberUpdate);

bBot.on("guildDelete", onGuildDelete);

pugPubSub.on("captains_ready", (guildId: string, pugName: string) => {
  log.info(`Captains ready for ${pugName} at guild ${guildId}`);
  const cache = store.getState();
  const pugs = cache.pugs[guildId];
  if (!pugs) return;

  const { channel: channelId, list } = pugs;
  const pug = list.find((p) => p.name === pugName);
  const guild = bBot.guilds.cache.get(guildId);
  if (!pug || !channelId || !guild) return;

  const channel = guild.channels.cache.get(channelId);
  if (!channel) return;

  sendToTextChannel(channel, formatBroadcastCaptainsReady(pug));
  log.info(`Broadcasted captains ready for ${pugName} at ${guildId}`);
});

const sendRestartMessageToGuilds = () => {
  const cache = store.getState();
  bBot.guilds.cache.forEach((guild) => {
    const pugs = cache.pugs[guild.id];
    const queries = cache.queries[guild.id];
    if (!pugs || !queries) return;

    const { channel: pugChannel } = pugs;
    const { channel: queryChannel } = queries;
    const channelId = pugChannel ? pugChannel : queryChannel;
    if (channelId) {
      const channel = bBot.channels.cache.get(channelId);
      sendToTextChannel(channel, `I just restarted ${emojis.wokege}`);
    }
  });
};

const monitorUsersForUnblocking = () => {
  setInterval(() => {
    const now = new Date();
    const cache = store.getState();
    Object.entries(cache.blocks).forEach(([guildId, blocks]) => {
      if (!blocks) return;

      const { list } = blocks;

      if (list.length > 0) {
        const guild = bBot.guilds.cache.get(guildId);
        if (!guild) return;

        const pugs = cache.pugs[guildId];
        if (!pugs) return;

        const { channel: channelId } = pugs;
        if (!channelId) return;

        const channel = guild.channels.cache.get(channelId);
        if (!channel?.isSendable()) return;
        list.forEach((user) => {
          const message = {
            guild,
            channel,
          } as Message;
          const mentionedUser = {
            ...user.culprit,
          } as User;
          if (compareAsc(now, user.expiresAt) >= 0) {
            commandHandlers["handleAdminUnblockPlayer"](
              message as Message<true>,
              [],
              mentionedUser,
            );
          }
        });
      }
    });
  }, 60000);
};

const monitorForAutoRemovals = () => {
  setInterval(() => {
    const now = new Date();
    const cache = store.getState();
    Object.entries(cache.misc).forEach(([guildId, misc]) => {
      if (!misc) return;
      const { autoremovals } = misc;

      const guild = bBot.guilds.cache.get(guildId);
      if (!guild) return;

      const pugs = cache.pugs[guildId];
      if (!pugs) return;

      const { channel: channelId } = pugs;
      if (!channelId) return;
      const channel = guild.channels.cache.get(channelId);
      if (!channel?.isSendable()) return;

      Object.entries(autoremovals).forEach(([userId, expiry]) => {
        if (expiry) {
          if (compareAsc(now, expiry) >= 0) {
            const user = bBot.users.cache.get(userId);
            const message = {
              guild,
              channel,
              content: "arr",
              author: {
                id: userId,
                username: user?.username ?? userId,
              },
            } as Message;
            commandHandlers["handleLeaveAllGameTypes"](
              message as Message<true>,
              [],
            );
          }
        }
      });
    });
  }, 60000);
};

(async () => {
  try {
    await connectDB();
    log.info(`Connected to database`);

    await hydrateStore();
    log.info(`Hydrated Store`);

    bBot.login(config.DISCORD_BOT_TOKEN);
  } catch (error) {
    console.log(`Error: ${error}`);
  }
})();

const logErrorToHQChannel = (message: string, error?: Error) => {
  const HQChannel = bBot.channels.cache.get(config.HQ_CHANNEL_ID);
  sendToTextChannel(HQChannel, `\`\`\`\n${message}\n${error?.stack}\`\`\``);
};

process.on("uncaughtException", (error) => {
  log.error(error);
  logErrorToHQChannel(error.message, error);
});

process.on("unhandledRejection", (reason) => {
  const msg = `Unhandled Promise Rejection for reason ${reason}`;
  log.error(msg);
  logErrorToHQChannel(msg);
});

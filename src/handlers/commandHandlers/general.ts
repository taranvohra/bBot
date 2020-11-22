import log from '../../log';
import { Guilds } from '~models';
import {
  updateGuildPugChannel,
  updateGuildQueryChannel,
  updateGuildPrefix,
} from '~actions';
import store, {
  initPugs,
  initMisc,
  initBlocks,
  initQueries,
  setPugChannel,
  setQueryChannel,
  setPrefix,
} from '~store';

export const handleRegisterServer: Handler = async (message, _) => {
  log.info(`Entering handleRegisterServer`);
  const { guild } = message;

  const guildExists = await Guilds.findById(guild?.id as string);
  if (guildExists) {
    message.channel.send(
      `This discord server is already registered with bBot :wink:`
    );
    return;
  }

  const newGuild = await Guilds.create({
    _id: guild?.id,
    queryChannel: '',
    pugChannel: '',
    gameTypes: [],
    queryServers: [],
    blockedUsers: [],
    ignoredCommandGroup: [],
  });

  const guildId = newGuild.id as string;
  log.info(`Registered new guild ${guild}`);
  log.debug(`Initializing store for ${guildId}`);

  store.dispatch(initPugs({ guildId, list: [], gameTypes: [], channel: null }));
  store.dispatch(
    initMisc({
      guildId,
      cooldowns: {},
      ignoredCommandGroup: new Set(),
      prefix: null,
    })
  );
  store.dispatch(initBlocks({ guildId, list: new Set() }));
  store.dispatch(initQueries({ guildId, list: [], channel: null }));

  message.channel.send(`**${guild?.name}** has been registered with bBot!`);
  log.info(`Exiting handleRegisterServer`);
};

export const handleSetPugChannel: Handler = async (message, _) => {
  log.info(`Entering handleSetPugChannel`);
  const {
    channel: { id: channelId },
    guild,
  } = message;

  const guildId = guild?.id as string;

  await updateGuildPugChannel(guildId, channelId);
  log.info(`Pug channel updated for guild ${guildId} to ${channelId}`);

  store.dispatch(setPugChannel({ guildId, channelId }));

  message.channel.send(`<#${channelId}> has been set as the pug channel`);
  log.info(`Exiting handleSetPugChannel`);
};

export const handleSetQueryChannel: Handler = async (message, _) => {
  log.info(`Entering handleSetQueryChannel`);
  const {
    channel: { id: channelId },
    guild,
  } = message;

  const guildId = guild?.id as string;

  await updateGuildQueryChannel(guildId, channelId);
  log.info(`Query channel updated for guild ${guildId} to ${channelId}`);

  store.dispatch(setQueryChannel({ guildId, channelId }));

  message.channel.send(`<#${channelId}> has been set as the query channel`);
  log.info(`Exiting handleSetQueryChannel`);
};

export const handleSetPrefix: Handler = async (message, args) => {
  log.info(`Entering handleSetPrefix`);
  const { guild } = message;
  const guildId = guild?.id as string;
  const [prefix] = args;

  if (prefix.length !== 1) {
    message.channel.send(`Prefix must be 1 character long`);
    return;
  }

  await updateGuildPrefix(guildId, prefix);
  log.info(`Prefix for guild ${guildId} set to ${prefix}`);

  message.channel.send(`**${prefix}** has been set as the default prefix`);
  log.info(`Exiting handleSetPrefix`);
};

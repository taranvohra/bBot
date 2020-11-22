import log from '../../log';
import { Guilds } from '~models';
import {
  updateGuildPugChannel,
  updateGuildQueryChannel,
  updateGuildPrefix,
  addGuildIgnoredCommandGroup,
  removeGuildIgnoredCommandGroup,
} from '~actions';
import store, {
  initPugs,
  initMisc,
  initBlocks,
  initQueries,
  setPugChannel,
  setQueryChannel,
  setPrefix,
  ignoreCommandGroup,
  unIgnoreCommandGroup,
} from '~store';

export const handleRegisterServer: Handler = async (message, _) => {
  log.info(`Entering handleRegisterServer`);
  const { guild } = message;
  const guildId = guild?.id as string;

  const guildExists = await Guilds.findById(guildId);
  if (guildExists) {
    log.debug(`${guildId} (${guild?.name}) is already registered`);
    message.channel.send(
      `This discord server is already registered with bBot :wink:`
    );
    return;
  }

  await Guilds.create({
    _id: guildId,
    queryChannel: '',
    pugChannel: '',
    gameTypes: [],
    queryServers: [],
    blockedUsers: [],
    ignoredCommandGroup: [],
  });

  log.info(`Registered new guild ${guild}`);
  log.debug(`Initializing store for ${guildId}`);

  store.dispatch(initPugs({ guildId, list: [], gameTypes: [], channel: null }));
  store.dispatch(
    initMisc({
      guildId,
      cooldowns: {},
      ignoredCommandGroup: [],
    })
  );
  store.dispatch(initBlocks({ guildId, list: [] }));
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

  store.dispatch(setPrefix({ guildId, prefix }));

  message.channel.send(`**${prefix}** has been set as the default prefix`);
  log.info(`Exiting handleSetPrefix`);
};

export const handleIgnoreCommandGroup: Handler = async (message, args) => {
  log.info(`Entering handleIgnoreCommandGroup`);
  const { guild } = message;
  const guildId = guild?.id as string;
  const group = args[0].toLowerCase();
  const cache = store.getState();
  const { ignoredCommandGroup } = cache.misc[guildId];

  // TODO: give a list of command groups in the message
  if (!group) {
    message.channel.send(`Please mention a command group`);
    return;
  }

  if (ignoredCommandGroup.includes(group)) {
    log.info(`Command group ${group} is already present`);
    message.channel.send(`Command group **${group}** is already ignored`);
    return;
  }

  await addGuildIgnoredCommandGroup(guildId, group);
  log.info(`Added ${group} to guild ${guildId}'s ignored command group`);

  store.dispatch(ignoreCommandGroup({ guildId, group }));

  message.channel.send(
    `Commands under group **${group}** will be ignored from now onwards`
  );
  log.info(`Exiting handleIgnoreCommandGroup`);
};

export const handleUnIgnoreCommandGroup: Handler = async (message, args) => {
  log.info(`Entering handleUnIgnoreCommandGroup`);
  const { guild } = message;
  const guildId = guild?.id as string;
  const group = args[0].toLowerCase();
  const cache = store.getState();
  const { ignoredCommandGroup } = cache.misc[guildId];

  // TODO: give a list of command groups in the message
  if (!group) {
    message.channel.send(`Please mention a command group`);
    return;
  }

  if (!ignoredCommandGroup.includes(group)) {
    log.info(`Command group ${group} was not ignored in the first place`);
    message.channel.send(
      `Invalid. Command group **${group}** was not ignored in the first place`
    );
    return;
  }

  await removeGuildIgnoredCommandGroup(guildId, group);
  log.info(`Removed ${group} from guild ${guildId}'s ignored command group`);

  store.dispatch(unIgnoreCommandGroup({ guildId, group }));

  message.channel.send(
    `Commands under group **${group}** will not be ignored from now onwards`
  );
  log.info(`Exiting handleUnIgnoreCommandGroup`);
};

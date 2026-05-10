import { TextChannel } from 'discord.js';
import log from '../log';
import { formatUserLogs } from '../formatting';
import { Guilds, GuildStats, Logs } from '~/models';
import {
  updateGuildPugChannel,
  updateGuildQueryChannel,
  updateGuildPrefix,
  addGuildIgnoredCommandGroup,
  removeGuildIgnoredCommandGroup,
  createNewUserLog
} from '~/actions';
import store, {
  initPugs,
  initMisc,
  initBlocks,
  initQueries,
  setPugChannel,
  setQueryChannel,
  setPrefix,
  ignoreCommandGroup,
  unIgnoreCommandGroup
} from '~/store';
import { CONSTANTS } from '~/utils';

export const handleRegisterServer: Handler = async (message, _) => {
  log.info(`Entering handleRegisterServer`);
  const { guild, channel } = message;

  const guildExists = await Guilds.findById(guild.id);
  if (guildExists) {
    log.debug(`${guild.id} (${guild.name}) is already registered`);
    channel.send(`This discord server is already registered with bBot :wink:`);
    return;
  }

  await Guilds.create({
    _id: guild.id,
    queryChannel: '',
    pugChannel: '',
    gameTypes: [],
    queryServers: [],
    blocks: [],
    ignoredCommandGroup: [],
    blockedCaptains: []
  });

  // If guild is de-registered and registered again
  // still try to create GuildStats and if it exists will just catch it 😇
  await GuildStats.create({
    _id: guild.id,
    total: 0,
    pugs: {}
  }).catch(() => {});

  log.info(`Registered new guild ${guild}`);
  log.debug(`Initializing store for ${guild.id}`);

  store.dispatch(
    initPugs({ guildId: guild.id, list: [], gameTypes: [], channel: null })
  );
  store.dispatch(
    initMisc({
      guildId: guild.id,
      cooldowns: {},
      ignoredCommandGroup: [],
      autoremovals: {}
    })
  );
  store.dispatch(initBlocks({ guildId: guild.id, list: [], captains: [] }));
  store.dispatch(initQueries({ guildId: guild.id, list: [], channel: null }));

  channel.send(`**${guild?.name}** has been registered with bBot!`);
  log.info(`Exiting handleRegisterServer`);
};

export const handleSetPugChannel: Handler = async (message, _) => {
  log.info(`Entering handleSetPugChannel`);
  const {
    channel,
    channel: { id: channelId },
    guild
  } = message;

  await updateGuildPugChannel(guild.id, channelId);
  log.info(`Pug channel updated for guild ${guild.id} to ${channelId}`);

  store.dispatch(setPugChannel({ guildId: guild.id, channelId }));

  channel.send(`<#${channelId}> has been set as the pug channel`);
  log.info(`Exiting handleSetPugChannel`);
};

export const handleSetQueryChannel: Handler = async (message, _) => {
  log.info(`Entering handleSetQueryChannel`);
  const {
    channel,
    channel: { id: channelId },
    guild
  } = message;

  await updateGuildQueryChannel(guild.id, channelId);
  log.info(`Query channel updated for guild ${guild.id} to ${channelId}`);

  store.dispatch(setQueryChannel({ guildId: guild.id, channelId }));

  channel.send(`<#${channelId}> has been set as the query channel`);
  log.info(`Exiting handleSetQueryChannel`);
};

export const handleSetPrefix: Handler = async (message, args) => {
  log.info(`Entering handleSetPrefix`);
  const { guild, channel } = message;

  const [prefix] = args;

  if (prefix.length !== 1) {
    channel.send(`Prefix must be 1 character long`);
    return;
  }

  await updateGuildPrefix(guild.id, prefix);
  log.info(`Prefix for guild ${guild.id} set to ${prefix}`);

  store.dispatch(setPrefix({ guildId: guild.id, prefix }));

  channel.send(`**${prefix}** has been set as the default prefix`);
  log.info(`Exiting handleSetPrefix`);
};

export const handleIgnoreCommandGroup: Handler = async (message, args) => {
  log.info(`Entering handleIgnoreCommandGroup`);
  const { guild, channel } = message;

  const group = args[0].toLowerCase();
  const cache = store.getState();
  const misc = cache.misc[guild.id];
  if (!misc) return;

  const { ignoredCommandGroup } = misc;

  if (!group || !CONSTANTS.commandGroups.includes(group)) {
    channel.send(`Please mention a command group, (pugs or queries)`);
    return;
  }

  if (ignoredCommandGroup.includes(group)) {
    log.info(`Command group ${group} is already present`);
    channel.send(`Command group **${group}** is already ignored`);
    return;
  }

  await addGuildIgnoredCommandGroup(guild.id, group);
  log.info(`Added ${group} to guild ${guild.id}'s ignored command group`);

  store.dispatch(ignoreCommandGroup({ guildId: guild.id, group }));

  channel.send(
    `Commands under group **${group}** will be ignored from now onwards`
  );
  log.info(`Exiting handleIgnoreCommandGroup`);
};

export const handleUnIgnoreCommandGroup: Handler = async (message, args) => {
  log.info(`Entering handleUnIgnoreCommandGroup`);
  const { guild, channel } = message;

  const group = args[0].toLowerCase();
  const cache = store.getState();
  const misc = cache.misc[guild.id];
  if (!misc) return;

  const { ignoredCommandGroup } = misc;

  if (!group || !CONSTANTS.commandGroups.includes(group)) {
    channel.send(`Please mention a command group, (pugs or queries)`);
    return;
  }

  if (!ignoredCommandGroup.includes(group)) {
    log.info(`Command group ${group} was not ignored in the first place`);
    channel.send(
      `Invalid. Command group **${group}** was not ignored in the first place`
    );
    return;
  }

  await removeGuildIgnoredCommandGroup(guild.id, group);
  log.info(`Removed ${group} from guild ${guild.id}'s ignored command group`);

  store.dispatch(unIgnoreCommandGroup({ guildId: guild.id, group }));

  channel.send(
    `Commands under group **${group}** will not be ignored from now onwards`
  );
  log.info(`Exiting handleUnIgnoreCommandGroup`);
};

export const handleWarnUser: Handler = async (message, args) => {
  log.info(`Entering handleWarnUser`);
  const { guild, mentions, author } = message;
  const { channel } = message;

  const mentionedUser = mentions.users.first();
  if (!mentionedUser) {
    channel.send(`No user was mentioned`);
    return;
  }

  const reason = args.slice(1).join(' ');
  if (!reason) {
    channel.send(`No reason mentioned`);
    return;
  }

  const logDescription = `**WARNED** for reason: __${reason}__ by <@${author.id}>`;
  createNewUserLog(guild.id, mentionedUser.id, logDescription);

  channel.send(
    `<@${mentionedUser.id}>, you have been **WARNED** for __${reason}__`
  );
  log.info(`Exiting handleWarnUser`);
};

export const handleViewUserLogs: Handler = async (message) => {
  log.info(`Entering handleViewUserLogs`);
  const { guild, mentions } = message;
  const { channel } = message;

  const mentionedUser = mentions.users.first();
  if (!mentionedUser) {
    channel.send(`No user was mentioned`);
    return;
  }

  const allUserLogs = await Logs.find({
    userId: mentionedUser.id,
    guildId: guild.id
  })
    .sort({ _id: -1 })
    .limit(10);

  const logsBody = formatUserLogs(allUserLogs);
  const msg = `:scroll: Showing last 10 logs of **${mentionedUser.username}** :scroll:\n\n${logsBody}`;

  message.author.send(msg);
  channel.send(`<@${message.author.id}>, you have received a DM`);
  log.info(`Exiting handleViewUserLogs`);
};

export const handleGetInvite: Handler = async (message) => {
  log.info(`Entering handleGetInvite`);
  const { guild, channel } = message;

  try {
    if (!('createInvite' in channel)) {
      throw new Error('Channel does not support invites');
    }

    const invite = await (channel as TextChannel).createInvite({
      maxAge: 0,
      maxUses: 0
    });
    channel.send(invite.url);
  } catch (error) {
    log.error(`Cannot create invites at guild ${guild.id}`);
    channel.send(
      `Could not create invite. Make sure \`Create Invite\` permission is ticked for me`
    );
  }

  log.info(`Exiting handleGetInvite`);
};

export const handleGetHelp: Handler = async (message) => {
  log.info(`Entering handleGetHelp`);
  const { author } = message;

  const body = `
    Hey :wave:,\n\nYou can find the list of commands and other documentation for this bot at https://github.com/taranvohra/bBot
  `;

  author.send(body);
  log.info(`Exiting handleGetHelp`);
};

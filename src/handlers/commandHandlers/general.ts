import log from '../../log';
import { Guilds } from '~models';
import store, { initPugs, initMisc, initBlocks, initQueries } from '~store';
import { updateGuildPugChannel } from '~actions';
export const handleRegisterServer: Handler = async (message, _) => {
  log.info(`Entering handleRegisterServer`);
  const { guild } = message;

  const guildExists = await Guilds.findById(guild?.id as string);
  if (guildExists) {
    return message.channel.send(
      `This discord server is already registered with bBot :wink:`
    );
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
    channel: { id },
    guild,
  } = message;

  await updateGuildPugChannel(guild?.id as string, id);
  log.info(`Pug channel updated for guild ${guild?.id} to ${id}`);

  message.channel.send(`<#${id}> has been set as the pug channel`);
  log.info(`Exiting handleSetPugChannel`);
};

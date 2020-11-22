import { Guilds } from '~models';
import store, { initPugs, initMisc, initBlocks, initQueries } from '~store';
import log from '../../log';

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
};

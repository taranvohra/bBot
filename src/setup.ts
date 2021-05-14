import config from './config';
import mongoose from 'mongoose';
import { DocumentType } from '@typegoose/typegoose';
import store, { initBlocks, initMisc, initQueries, initPugs } from '~/store';
import { Guild as GuildClass, Guilds } from '~/models';

export const connectDB = async () =>
  await mongoose.connect(config.DB, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
  });

export const hydrateStore = async () => {
  const cursor = Guilds.find({}).lean().cursor();
  for (
    let guild: DocumentType<GuildClass> = await cursor.next();
    guild != null;
    guild = await cursor.next()
  ) {
    const guildId = guild._id as string;
    const {
      pugChannel,
      queryChannel,
      ignoredCommandGroup,
      gameTypes,
      queryServers,
      blocks,
      prefix,
    } = guild;

    store.dispatch(initBlocks({ guildId, list: blocks }));
    store.dispatch(
      initMisc({
        guildId,
        ignoredCommandGroup,
        prefix,
        cooldowns: {},
        autoremovals: {},
      })
    );
    store.dispatch(
      initQueries({ guildId, channel: queryChannel, list: queryServers })
    );
    store.dispatch(
      initPugs({ guildId, channel: pugChannel, gameTypes, list: [] })
    );
  }
};

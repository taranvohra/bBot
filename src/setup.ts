import mongoose from 'mongoose';
import { DocumentType } from '@typegoose/typegoose';
import store, { initBlocks, initMisc, initQueries, initPugs } from '~/store';
import { Guild as GuildClass, Guilds } from '~/models';

export const connectDB = async () =>
  await mongoose.connect(process.env.DB as string, {
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

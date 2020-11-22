import { Guilds } from '~models';

export const updateGuildPugChannel = (guildId: string, channelId: string) =>
  Guilds.findByIdAndUpdate(guildId, {
    $set: {
      pugChannel: channelId,
    },
  }).exec();

export const updateGuildQueryChannel = (guildId: string, channelId: string) =>
  Guilds.findByIdAndUpdate(guildId, {
    $set: {
      queryChannel: channelId,
    },
  }).exec();

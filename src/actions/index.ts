import { Guilds } from '~models';

export const updateGuildPugChannel = (guildId: string, channelId: string) =>
  Guilds.findByIdAndUpdate(guildId, {
    $set: {
      pugChannel: channelId,
    },
  });

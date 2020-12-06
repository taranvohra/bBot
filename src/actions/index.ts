import { Guilds, GameType, GuildPugCounts } from '~models';

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

export const updateGuildPrefix = (guildId: string, prefix: string) =>
  Guilds.findByIdAndUpdate(guildId, {
    $set: {
      prefix,
    },
  }).exec();

export const addGuildIgnoredCommandGroup = (guildId: string, group: string) =>
  Guilds.findByIdAndUpdate(guildId, {
    $addToSet: {
      ignoredCommandGroup: group,
    },
  }).exec();

export const removeGuildIgnoredCommandGroup = (
  guildId: string,
  group: string
) =>
  Guilds.findByIdAndUpdate(guildId, {
    $pull: {
      ignoredCommandGroup: group,
    },
  }).exec();

export const addGuildGameType = (guildId: string, gameType: GameType) =>
  Guilds.findByIdAndUpdate(guildId, {
    $push: {
      gameTypes: gameType,
    },
  }).exec();

export const deleteGuildGameType = (guildId: string, gameTypeName: string) =>
  Guilds.findByIdAndUpdate(guildId, {
    $pull: { gameTypes: { name: gameTypeName } },
  }).exec();

export const getNextSequences = async (
  guildId: string,
  gameTypeName: string
) => {
  const updated = await GuildPugCounts.findByIdAndUpdate(
    guildId,
    {
      $inc: {
        total: 1,
        [`pugs.${gameTypeName}`]: 1,
      },
    },
    { new: true }
  ).exec();

  if (updated) {
    return { total: updated.total, current: updated.pugs[gameTypeName] };
  }
};

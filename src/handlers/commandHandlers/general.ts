import { Guilds } from '~models';
import log from '../../log';

export const handleRegisterServer: Handler = async (message, args) => {
  log.info(`Entering handleRegisterServer`);
  const { guild } = message;

  const guildExists = await Guilds.fetchGuild(guild?.id as string);
  if (guildExists) {
    return message.channel.send(
      `This discord server is already registered with bBot :wink:`
    );
  }

  const guildRes = await Guilds.create({
    _id: guild?.id,
    queryChannel: '',
    pugChannel: '',
    gameTypes: [],
    queryServers: [],
    blockedUsers: [],
    ignoredCommandGroup: [],
  });
};

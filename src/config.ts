import env from 'env-var';

export default {
  DB: env.get('DB').required().asString(),
  DISCORD_BOT_TOKEN: env.get('DISCORD_BOT_TOKEN').required().asString(),
  GEOLITE2_LICENSE_KEY: env.get('GEOLITE2_LICENSE_KEY').required().asString(),
  HQ_CHANNEL_ID: env.get('HQ_CHANNEL_ID').required().asString(),
};

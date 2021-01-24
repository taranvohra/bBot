import { getModelForClass, prop } from '@typegoose/typegoose';

class Log {
  @prop()
  guildId!: string;

  @prop()
  userId!: string;

  @prop()
  timestamp!: Date;

  @prop()
  description!: string;
}

export const Logs = getModelForClass(Log);

import { getModelForClass, prop } from '@typegoose/typegoose';

export class Log {
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

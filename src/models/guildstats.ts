import { getModelForClass, prop } from '@typegoose/typegoose';

export class GuildStat {
  @prop({ type: String })
  _id!: string;

  @prop()
  total!: number;

  @prop()
  pugs!: {
    [key: string]: number;
  };
}

export const GuildStats = getModelForClass(GuildStat);

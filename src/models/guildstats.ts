import { getModelForClass, prop, modelOptions } from '@typegoose/typegoose';

@modelOptions({
  options: {
    allowMixed: 0,
  },
})
class GuildStat {
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

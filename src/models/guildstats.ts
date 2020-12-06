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
  total!: Number;

  @prop()
  pugs!: {
    [key: string]: Number;
  };
}

export const GuildStats = getModelForClass(GuildStat);

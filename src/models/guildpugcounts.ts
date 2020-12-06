import { getModelForClass, prop } from '@typegoose/typegoose';

class GuildPugCount {
  @prop({ type: String })
  _id!: string;

  @prop()
  pugs!: {
    [key: string]: Number;
  };
}

export const GuildPugCounts = getModelForClass(GuildPugCount);

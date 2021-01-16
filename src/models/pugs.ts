import { getModelForClass, prop, modelOptions } from '@typegoose/typegoose';
import { Pug as PugClass } from './Pug';

@modelOptions({
  options: {
    customName: 'Pugs',
  },
})
export class PugSchema {
  @prop()
  guildId!: string;

  @prop()
  name!: string;

  @prop()
  timestamp!: Date;

  @prop()
  gameSequence!: number;

  @prop()
  overallSequence!: number;

  @prop({ _id: false })
  game!: {
    pug: PugClass;
    winner?: number;
    mapvote?: number;
  };
}

export const Pugs = getModelForClass(PugSchema);

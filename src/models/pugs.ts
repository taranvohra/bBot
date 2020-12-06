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
  winner?: Number;

  @prop()
  gameSequence!: Number;

  @prop()
  overallSequence!: Number;

  @prop({ _id: false })
  game!: {
    pug: PugClass;
    winner?: Number;
  };
}

export const Pugs = getModelForClass(PugSchema);

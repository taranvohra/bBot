import { getModelForClass, prop, modelOptions } from '@typegoose/typegoose';
import { Pug as PugType } from './Pug';

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
  pug!: PugType;

  @prop()
  seqNumber!: Number;
}

export const Pugs = getModelForClass(PugSchema);

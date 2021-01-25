import { getModelForClass, prop, Ref } from '@typegoose/typegoose';
import { PugSchema as Pug } from './pugs';

class Stat {
  @prop()
  rating!: number;

  @prop()
  totalCaptain!: number;

  @prop()
  totalPugs!: number;

  @prop()
  won!: number;

  @prop()
  lost!: number;
}

export class User {
  @prop()
  userId!: string;

  @prop()
  guildId!: string;

  @prop()
  username!: string;

  @prop()
  defaultJoins!: string[];

  @prop()
  stats!: {
    [pug: string]: Stat;
  };

  @prop({ ref: 'Pugs' })
  lastPug?: Ref<Pug>;
}

export const Users = getModelForClass(User);

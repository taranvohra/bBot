import { getModelForClass, prop } from '@typegoose/typegoose';

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
  @prop({ type: String })
  _id!: string;

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

  // TODO: Add Ref for lastPug
}

export const Users = getModelForClass(User);

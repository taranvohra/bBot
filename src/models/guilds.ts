import { getModelForClass, prop } from '@typegoose/typegoose';

class GameType {
  @prop()
  name!: string;

  @prop()
  noOfPlayers!: number;

  @prop()
  noOfTeams!: number;

  @prop()
  pickingOrder!: number[];

  @prop()
  isCoinFlipEnabled!: boolean;
}

class QueryServer {
  @prop()
  key!: string;

  @prop()
  name!: string;

  @prop()
  host!: string;

  @prop()
  port!: number;

  @prop()
  timestamp!: Date;
}

class Tenant {
  @prop()
  serverId!: string;

  @prop()
  pugChannel?: string;

  @prop()
  queryChannel?: string;

  @prop()
  prefix?: string;

  @prop()
  ignoredCommandGroup?: string[];

  @prop({ _id: false })
  gameTypes?: GameType[];

  @prop({ _id: false })
  queryServers?: QueryServer[];
}

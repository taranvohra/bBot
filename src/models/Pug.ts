import { Pug as TPug, PugPlayer } from '~store';

type User = Pick<PugPlayer, 'id' | 'name' | 'stats'>;

export class Pug implements TPug {
  name: string;
  noOfPlayers: number;
  noOfTeams: number;
  pickingOrder: Array<number>;
  isInPickingMode: boolean;
  turn: number;
  players: Array<PugPlayer>;
  captains: Array<number>;
  timerFn: number | null;
  isCoinFlipEnabled: boolean;

  constructor({
    name,
    noOfPlayers,
    noOfTeams,
    pickingOrder,
    isCoinFlipEnabled,
  }: {
    name: string;
    noOfPlayers: number;
    noOfTeams: number;
    pickingOrder: Array<number>;
    isCoinFlipEnabled: boolean;
  }) {
    this.name = name;
    this.noOfPlayers = noOfPlayers;
    this.noOfTeams = noOfTeams;
    this.pickingOrder = pickingOrder;
    this.isCoinFlipEnabled = isCoinFlipEnabled;
    this.isInPickingMode = false;
    this.turn = 0;
    this.players = [];
    this.captains = [];
    this.timerFn = null;
  }

  addPlayer(user: User) {
    this.players.push({
      team: null,
      pick: null,
      tag: '',
      ...user,
    });
  }
}

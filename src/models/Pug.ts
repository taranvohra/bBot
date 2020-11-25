export class Pug {
  name: string;
  noOfPlayers: number;
  noOfTeams: number;
  pickingOrder: Array<number>;
  isInPickingMode: boolean;
  turn: number;
  players: Array<{}>;
  captains: Array<{}>;
  timer: number | null;

  constructor({
    name,
    noOfPlayers,
    noOfTeams,
    pickingOrder,
  }: {
    name: string;
    noOfPlayers: number;
    noOfTeams: number;
    pickingOrder: Array<number>;
  }) {
    this.name = name;
    this.noOfPlayers = noOfPlayers;
    this.noOfTeams = noOfTeams;
    this.pickingOrder = pickingOrder;
    this.isInPickingMode = false;
    this.turn = 0;
    this.players = [];
    this.captains = [];
    this.timer = null;
  }
}

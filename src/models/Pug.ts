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
    // put cases if player is already in, couldnt join or joined
  }

  removePlayer(id: string) {
    const playerIndex = this.players.findIndex((p) => p.id === id);
    this.players.splice(playerIndex, 1);
    // if picking then stop pug, put check in handler
  }

  addTag(id: string, tag: string) {
    this.players.forEach((p) => {
      if (p.id === id) p.tag = tag;
    });
  }

  removeTag(id: string) {
    this.players.forEach((p) => {
      if (p.id === id) p.tag = '';
    });
  }

  stopPug() {
    if (this.timerFn) clearTimeout(this.timerFn);
    this.isInPickingMode = false;
    this.turn = 0;
    this.captains = [];
    this.players.forEach((p) => {
      p.pick = null;
      p.team = null;
    });
  }

  isEmpty() {
    return this.players.length === 0;
  }

  areCaptainsDecided() {
    return this.captains.filter(Boolean).length === this.noOfTeams;
  }
}

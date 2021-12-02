import {
  getRandomInt,
  shuffle,
  CONSTANTS,
  powerSet,
  isDuelPug,
  getGuildBlockedCaptains,
} from '~/utils';
import { pugPubSub } from '../pubsub';

type PugUser = Pick<PugPlayer, 'id' | 'name' | 'stats'>;

type PugStat = {
  totalCaptain: number;
  totalPugs: number;
  rating: number;
  won: number;
  lost: number;
};

export type PugPlayer = {
  id: string;
  name: string;
  tag: string;
  team: number | null;
  pick: number | null;
  stats: {
    [gametype: string]: PugStat;
  };
};

export class Pug {
  name: string;
  noOfPlayers: number;
  noOfTeams: number;
  pickingOrder: Array<number>;
  isInPickingMode: boolean;
  turn: number;
  players: Array<PugPlayer>;
  captains: Array<string>;
  timerFn: ReturnType<typeof setTimeout> | null;
  isCoinFlipEnabled: boolean;
  isMix: boolean;
  teamEmojis?: TeamEmojis;

  constructor({
    name,
    noOfPlayers,
    noOfTeams,
    pickingOrder,
    isCoinFlipEnabled,
    isMix,
    teamEmojis,
  }: {
    name: string;
    noOfPlayers: number;
    noOfTeams: number;
    pickingOrder: Array<number>;
    isCoinFlipEnabled: boolean;
    isMix: boolean;
    teamEmojis?: TeamEmojis;
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
    this.isMix = isMix;
    this.teamEmojis = teamEmojis;
  }

  addPlayer(user: PugUser) {
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

  addCaptain(id: string, tIndex?: number) {
    while (1) {
      const teamIndex =
        tIndex !== undefined ? tIndex : getRandomInt(0, this.noOfTeams - 1);

      if (!this.captains[teamIndex]) {
        const playerIndex = this.players.findIndex((p) => p.id === id);
        this.captains[teamIndex] = id;
        this.players[playerIndex].team = teamIndex;
        this.players[playerIndex].pick = 0;
        break;
      }
    }
    if (this.areCaptainsDecided() && this.timerFn) clearTimeout(this.timerFn);
    // check manually if in handler if captains are decided to send msg or w/e
  }

  pickPlayer(playerIndex: number, team: number) {
    this.players[playerIndex].team = team;
    this.turn = this.turn + 1;
    this.players[playerIndex].pick = this.turn;

    // last pick automatically goes
    if (this.turn === this.pickingOrder.length - 1) {
      const lastPlayerIndex = this.players.findIndex((p) => p.team === null);
      const lastPlayerTeam = this.pickingOrder[this.turn];

      this.players[lastPlayerIndex].team = lastPlayerTeam;
      this.turn = this.turn + 1;
      this.players[lastPlayerIndex].pick = this.turn;

      this.isInPickingMode = false;
      return { lastPlayerIndex };
    }
    return { lastPlayerIndex: null };
    // check manually in handler if player is already picked or not and send msg
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

  resetPug(guildId: string) {
    this.stopPug();
    this.fillPug(guildId);
  }

  isEmpty() {
    return this.players.length === 0;
  }

  isCaptain(id: string) {
    return this.captains.includes(id);
  }

  getCurrentCaptainCount() {
    return this.captains.filter(Boolean).length;
  }

  areCaptainsDecided() {
    return this.getCurrentCaptainCount() === this.noOfTeams;
  }

  fillPug(guildId: string) {
    this.isInPickingMode = true;

    /**
     *  No captain picking for the following modes -  Duel, Mix, DM
     */

    if (isDuelPug(this.pickingOrder) || this.isMix || this.noOfTeams === 1)
      return;

    this.timerFn = setTimeout(async () => {
      /**
       * Because we have an async call, if by the time it resolves and captains are
       * already picked, there is no point executing rest of the code
       */
      const guildBlockedCaptains = await getGuildBlockedCaptains(guildId);
      const noOfCaptainsToDecide =
        this.noOfTeams - this.getCurrentCaptainCount();
      if (noOfCaptainsToDecide === 0) return;

      const playersNotCaptain = this.players.filter(
        (p) => this.isCaptain(p.id) === false
      );
      const remaining = playersNotCaptain.length;
      const poolSize = Math.ceil(remaining * 0.6);
      const initialPoolForCaptains = shuffle(playersNotCaptain)
        .slice(0, poolSize)
        .sort((a, b) => a.stats[this.name].rating - b.stats[this.name].rating);
      let playersCaptBlockedInCurrentPool = initialPoolForCaptains.filter((c) =>
        guildBlockedCaptains.some((gbc) => gbc.culprit.id === c.id)
      );
      const playersNotCaptBlockedInCurrentPool = initialPoolForCaptains.filter(
        (c) => guildBlockedCaptains.every((gbc) => gbc.culprit.id !== c.id)
      );
      const finalPoolForCaptains = [...playersNotCaptBlockedInCurrentPool];
      if (finalPoolForCaptains.length < noOfCaptainsToDecide) {
        while (finalPoolForCaptains.length < noOfCaptainsToDecide) {
          const [randomPlayer, ...remaining] = shuffle(
            playersCaptBlockedInCurrentPool
          );
          finalPoolForCaptains.push(randomPlayer);
          playersCaptBlockedInCurrentPool = remaining;
        }
      }

      const poolPowerSet = powerSet(finalPoolForCaptains);
      const focusedSets = poolPowerSet.filter(
        (s) => s.length === noOfCaptainsToDecide
      );
      const existingCapts = this.players.filter(
        (p) => this.isCaptain(p.id) === true
      );

      const setsSortedByRatings = focusedSets.reduce((acc, curr) => {
        const sortedSet = [...curr, ...existingCapts].sort((a, b) => {
          const aRating = a.stats[this.name].rating;
          const bRating = b.stats[this.name].rating;
          return aRating - bRating;
        });
        acc.push(sortedSet);
        return acc;
      }, [] as typeof focusedSets);

      const [bestSet] = setsSortedByRatings.slice().sort((setA, setB) => {
        const setAFirst = setA[0].stats[this.name].rating;
        const setALast = setA[setA.length - 1].stats[this.name].rating;
        const setBFirst = setB[0].stats[this.name].rating;
        const setBLast = setB[setB.length - 1].stats[this.name].rating;

        const diffA = setALast - setAFirst;
        const diffB = setBLast - setBFirst;
        return diffA - diffB;
      });

      bestSet.forEach((player) => {
        if (!this.isCaptain(player.id)) {
          while (1) {
            const randomTeamIndex = getRandomInt(0, this.noOfTeams - 1);
            if (!this.captains[randomTeamIndex]) {
              this.addCaptain(player.id, randomTeamIndex);
              break;
            }
          }
        }
      });

      pugPubSub.emit('captains_ready', guildId, this.name);
    }, CONSTANTS.autoCaptainPickTimer);
  }
}

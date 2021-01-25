import { getRandomInt, shuffle, CONSTANTS, powerSet } from '~utils';
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

    // 1v1 picking order is basically [-1]
    if (this.pickingOrder.length === 1 && this.pickingOrder[0] === -1) return;

    this.timerFn = setTimeout(() => {
      const playersNotCaptain = this.players.filter(
        (p) => this.isCaptain(p.id) === false
      );
      const remaining = playersNotCaptain.length;

      const poolForCaptains = shuffle(playersNotCaptain)
        .slice(0, remaining * 0.6)
        .sort((a, b) => a.stats[this.name].rating - b.stats[this.name].rating);

      if (this.noOfTeams === 2) {
        if (this.getCurrentCaptainCount() === 0) {
          let leastDiff = Number.MAX_SAFE_INTEGER;
          let pair = [0, 1];

          // Finding Pair with least diff in ratings wrt each other
          for (let i = 1; i < poolForCaptains.length - 1; i++) {
            const iRating = poolForCaptains[i].stats[this.name].rating;
            const iMinus1Rating =
              poolForCaptains[i - 1].stats[this.name].rating;
            const iPlus1Rating = poolForCaptains[i + 1].stats[this.name].rating;

            const left = {
              pair: [i, i - 1],
              diff: Math.abs(iRating - iMinus1Rating),
            };
            const right = {
              pair: [i, i + 1],
              diff: Math.abs(iRating - iPlus1Rating),
            };

            const smallest = Math.min(left.diff, right.diff);
            if (smallest === left.diff && smallest <= leastDiff) {
              leastDiff = left.diff;
              pair = left.pair;
            } else if (smallest === right.diff && smallest <= leastDiff) {
              leastDiff = right.diff;
              pair = right.pair;
            }
          }

          const firstCaptain = poolForCaptains[pair[0]];
          const secondCaptain = poolForCaptains[pair[1]];

          const [strongCaptain, weakCaptain] = [
            firstCaptain,
            secondCaptain,
          ].sort(
            (a, b) => b.stats[this.name].rating - a.stats[this.name].rating
          );

          const strongPlayersCount = this.players.reduce((acc, curr) => {
            const playerRating = curr.stats[this.name].rating;
            if (playerRating <= CONSTANTS.strongPlayersRatingThreshold)
              acc = acc + 1;
            return acc;
          }, 0);

          if (strongPlayersCount >= 4 && strongPlayersCount <= 5) {
            this.addCaptain(strongCaptain.id, 0);
            this.addCaptain(weakCaptain.id, 1);
          } else {
            this.addCaptain(strongCaptain.id, 1);
            this.addCaptain(weakCaptain.id, 0);
          }
        } else {
          // 1 Captain already ready
          const [fId] = this.captains.filter(Boolean);
          const firstCaptainIndex = this.players.findIndex((p) => p.id === fId);
          const firstCaptain = this.players[firstCaptainIndex];
          const firstCaptainRating = firstCaptain.stats[this.name].rating;

          let leastDiff = 10_000;
          let otherCaptainIndex = -1;

          for (let i = 0; i < poolForCaptains.length; i++) {
            const iRating = poolForCaptains[i].stats[this.name].rating;
            const diff = Math.abs(firstCaptainRating - iRating);
            if (diff <= leastDiff) {
              leastDiff = diff;
              otherCaptainIndex = i;
            }
          }

          const otherCaptain = poolForCaptains[otherCaptainIndex];
          const otherCaptainTeam = Math.abs((firstCaptain.team! % 2) - 1);
          this.addCaptain(otherCaptain.id, otherCaptainTeam);
        }
      } else {
        const noOfCaptainsToDecide =
          this.noOfTeams - this.getCurrentCaptainCount();
        const poolPowerSet = powerSet(poolForCaptains);
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
      }

      pugPubSub.emit('captains_ready', guildId, this.name);
    }, CONSTANTS.autoCaptainPickTimer);
  }
}

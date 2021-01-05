import { User } from 'discord.js';
import { isDocument } from '@typegoose/typegoose';
import { Pug, User as PugUser } from '~models';
import { CONSTANTS, emojis, teamEmojis, teams, isDuelPug } from '~utils';
import { formatDistanceStrict } from 'date-fns';

export const formatPugFilledDM = (pug: Pug, guildName: string) => {
  const DMTitle = `**${pug.name.toUpperCase()}** filled in **${guildName}**`;
  const DMBody = pug.players.reduce((acc, curr, i) => {
    acc = acc + `${i === 0 ? '' : ' :small_blue_diamond: '}${curr.name}`;
    return acc;
  }, ``);
  return `${DMTitle}\n${DMBody}`;
};

export const formatJoinStatus = (statuses: Array<JoinStatus>) => {
  const { joined, missed, nf, aj, username } = statuses.reduce(
    (acc, { name, result, pug, user }) => {
      switch (result) {
        case 'not-found':
          acc.nf += `No pug found: **${name.toUpperCase()}**\n`;
          break;
        case 'full':
          acc.missed += `Sorry, **${name.toUpperCase()}** is already filled ${
            emojis.tearddy
          }\n`;
          break;
        case 'joined':
          acc.joined += `**${name.toUpperCase()}** (${pug?.players.length}/${
            pug?.noOfPlayers
          }) :small_orange_diamond: `;
          break;
        case 'present':
          acc.aj += `**${name.toUpperCase()}** `;
          break;
      }
      acc.username = user?.username ?? acc.username;
      return acc;
    },
    { joined: ``, missed: ``, nf: ``, aj: ``, username: `` }
  );

  return `${
    joined.length > 0
      ? `${username} joined :small_orange_diamond: ${joined}`
      : ``
  } ${missed.length > 0 ? `\n${missed}` : ``} ${
    aj.length > 0 ? `\n${username} has already joined ${aj}` : ``
  } ${nf.length > 0 ? `\n${nf}` : ``}`;
};

export const formatLeaveStatus = (
  statuses: Array<LeaveStatus>,
  wentOffline?: boolean
) => {
  const { left, nf, nj, username } = statuses.reduce(
    (acc, { name, result, pug, user }) => {
      switch (result) {
        case 'left':
          acc.left += `${
            acc.left.length > 0 ? `, ` : ``
          }**${name.toUpperCase()}** (${pug?.players.length}/${
            pug?.noOfPlayers
          })`;
          break;
        case 'not-in':
          acc.nj = `Cannot leave pug(s) you haven't joined `;
          break;
        case 'not-found':
          acc.nf += `No pug found: **${name.toUpperCase()}**`;
          break;
      }
      acc.username = user?.username ?? '';
      return acc;
    },
    {
      left: ``,
      nj: ``,
      nf: ``,
      username: ``,
    }
  );

  return `${
    left.length > 0
      ? `${username} left  ${left} ${
          wentOffline ? `because the user went offline` : ``
        }`
      : ``
  }${nj.length > 0 ? `\n${nj}` : ``}${nj.length > 0 ? `\n${nf}` : ``}`;
};

export const formatDeadPugs = (deadPugs: Array<{ pug: Pug; user: User }>) => {
  return deadPugs.reduce((acc, { pug, user }, i) => {
    acc += `${i > 0 ? `\n` : ``} ${
      emojis.peepoComfy
    } **${pug.name.toUpperCase()}** was stopped because **${
      user.username
    }** left ${emojis.peepoComfy}`;
    return acc;
  }, ``);
};

export const formatBroadcastPug = (pug: Pug) => {
  const title = `${
    emojis.peepoComfy
  } :mega: **${pug.name.toUpperCase()}** has been filled!`;

  const body = pug.players.reduce((acc, player) => {
    acc += `<@${player.id}> `;
    return acc;
  }, ``);

  const isDuel = pug.pickingOrder.length === 1 && pug.pickingOrder[0] === -1;
  const footer = isDuel
    ? ``
    : `Type **${
        CONSTANTS.defaultPrefix
      }captain** to become a captain for this pug. Random captains will be picked in ${
        CONSTANTS.autoCaptainPickTimer / 1000
      } seconds`;

  return `${title}\n${body}\n${footer}\n`;
};

export const formatListGameType = (pug: Pug) => {
  const title = `**${pug.name.toUpperCase()}** (${pug.players.length}/${
    pug.noOfPlayers
  })`;
  const players = pug.players.reduce((acc, p) => {
    acc += `:small_orange_diamond: ${p.name} `;
    return acc;
  }, ``);
  return `${title}${players}`;
};

export const formatListGameTypes = (
  list: Array<{ name: string; currPlayers: number; maxPlayers: number }>,
  guildName: string
) => {
  const title = `Pugs available at **${guildName}**`;
  const sortedList = list.sort((a, b) => b.currPlayers - a.currPlayers);
  const body = sortedList.reduce((acc, curr, i) => {
    acc += `**${curr.name.toUpperCase()}** (${curr.currPlayers}/${
      curr.maxPlayers
    }) ${i === list.length - 1 ? '' : ':small_orange_diamond:'}`;
    return acc;
  }, ``);
  return `${title}\n${body}`;
};

export const formatListAllCurrentGameTypes = (
  list: Array<Pug>,
  guildName: string
) => {
  const body = list.reduce((prev, curr) => {
    const base = `**${curr.name.toUpperCase()}** (${curr.players.length}/${
      curr.noOfPlayers
    }) `;

    const players = curr.players.reduce((acc, p) => {
      acc += `:small_orange_diamond: ${p.name} `;
      return acc;
    }, ``);
    prev += `${base}${players}\n`;
    return prev;
  }, ``);

  return body
    ? `Listing active pugs at **${guildName}**\n${body}`
    : `There are currently no active pugs, try joining one!`;
};

const getTeamIndex = (index: number) => {
  switch (index) {
    case 0:
      return 'team_0';
    case 1:
      return 'team_1';
    case 2:
      return 'team_2';
    case 3:
      return 'team_3';
    case 255:
      return 'team_255';
    default:
      return 'spec';
  }
};

export const formatBroadcastCaptainsReady = (pug: Pug) => {
  const pugCaptains = pug.captains.reduce((acc, curr, index) => {
    const teamIndex = getTeamIndex(index);
    acc += `<@${curr}> is the captain for ${teamEmojis[teamIndex]} **${teams[teamIndex]}** ${teamEmojis[teamIndex]}\n`;
    return acc;
  }, ``);

  const turn = `<@${pug.captains[0]}> pick 1 player for **${teams[`team_0`]}**`;
  const nonCaptainPlayers = pug.players.reduce((acc, curr, index) => {
    if (!pug.captains.includes(curr.id)) {
      const rating =
        curr.stats[pug.name].rating === 0
          ? 'no rating'
          : curr.stats[pug.name].rating.toFixed(2);
      acc += `**${index + 1})** *${curr.name}* (${rating}) ${
        curr.tag ? `[${curr.tag}] ` : ``
      }`;
    }
    return acc;
  }, `Players: `);

  return `${pugCaptains}\n${turn}\n${nonCaptainPlayers}`;
};

export const formatAddCaptainStatus = (username: string, team: number) => {
  const teamIndex = getTeamIndex(team);
  return `**${username}** became captain for ${teamEmojis[teamIndex]} **${teams[
    teamIndex
  ].toUpperCase()}** ${teamEmojis[teamIndex]}`;
};

export const formatPickPlayerStatus = (
  pug: Pug,
  pickedPlayers: Array<number>
) => {
  const picked = pickedPlayers.reduce((acc, curr) => {
    const currPlayer = pug.players[curr];
    const teamIndex = getTeamIndex(currPlayer.team as number);
    acc += `<@${currPlayer.id}> was picked for **${teams[teamIndex]}**\n`;
    return acc;
  }, ``);

  let count = 0;
  const next = pug.players.find(
    (p) => p.id === pug.captains[pug.pickingOrder[pug.turn]]
  );

  if (pug.isInPickingMode) {
    for (let i = pug.turn; ; i++) {
      if (pug.pickingOrder[i] !== next?.team) break;
      count++;
    }
  }

  const teamIndex = getTeamIndex(next?.team as number);
  const turn = pug.isInPickingMode
    ? `<@${next?.id}> pick ${count} player${count > 1 ? 's' : ''} for **${
        teams[teamIndex]
      }**`
    : `:fire: **Picking has finished** :fire:`;

  const pugTeams = Array.from(
    {
      length: pug.noOfTeams,
    },
    (_, i) => i
  ).reduce((acc, _, i) => {
    const teamIndex = getTeamIndex(i);
    acc[i] = `**${teams[teamIndex]}** ${teamEmojis[teamIndex]}`;
    return acc;
  }, {} as { [team: number]: string });

  const players = pug.players.reduce((acc, curr, index) => {
    if (curr.team === null)
      acc += `**${index + 1})** *${curr.name}* (${
        curr.stats[pug.name].rating === 0
          ? 'no rating'
          : curr.stats[pug.name].rating.toFixed(2)
      }) ${curr.tag ? `[${curr.tag}] ` : ``}`;
    return acc;
  }, `Players: `);

  const currTeams = pug.players
    .slice()
    .sort((a, b) => Number(a.pick) - Number(b.pick))
    .reduce((acc, curr) => {
      if (curr.team !== null)
        acc[curr.team] += `*${curr.name}* :small_orange_diamond: `;
      return acc;
    }, pugTeams);

  const activeTeams = Object.values(currTeams).reduce((acc, curr) => {
    acc += `${curr.slice(0, curr.length - 24)}\n`;
    return acc;
  }, ``);

  return `${picked}\n${turn}\n${pug.isInPickingMode ? '\n' : ''}${
    pug.isInPickingMode ? `${players}\n` : ``
  }\n${activeTeams}`;
};

export const formatCoinFlipMapvoteWinner = (winningTeamIndex: number) => {
  const head = `---- *mapvote coin flip* ----`;
  const teamIndex = getTeamIndex(winningTeamIndex);
  const body = `${teamEmojis[teamIndex]} **${teams[
    teamIndex
  ].toUpperCase()}** ${teamEmojis[teamIndex]} won **mapvote**`;
  return `${head}\n${body}`;
};

export const formatPugsInPicking = (pugs: Array<Pug>) => {
  return pugs.reduce((acc, pug) => {
    let count = 0;
    const next = pug.players.find(
      (p) => p.id === pug.captains[pug.pickingOrder[pug.turn]]
    );

    if (pug.isInPickingMode) {
      for (let i = pug.turn; ; i++) {
        if (pug.pickingOrder[i] !== next?.team) break;
        count++;
      }
    }

    const teamIndex = getTeamIndex(next?.team as number);
    const turn = `<@${next?.id}> pick ${count} player${
      count > 1 ? 's' : ''
    } for **${teams[teamIndex]}**`;

    const pugTeams = Array.from(
      {
        length: pug.noOfTeams,
      },
      (_, i) => i
    ).reduce((acc, _, i) => {
      const teamIndex = getTeamIndex(i);
      acc[i] = `**${teams[teamIndex]}** ${teamEmojis[teamIndex]}`;
      return acc;
    }, {} as { [team: number]: string });

    const players = pug.players.reduce((acc, curr, index) => {
      if (curr.team === null)
        acc += `**${index + 1})** *${curr.name}* (${
          curr.stats[pug.name].rating === 0
            ? 'no rating'
            : curr.stats[pug.name].rating.toFixed(2)
        }) ${curr.tag ? `[${curr.tag}] ` : ``}`;
      return acc;
    }, `Players: `);

    const currTeams = pug.players
      .slice()
      .sort((a, b) => Number(a.pick) - Number(b.pick))
      .reduce((acc, curr) => {
        if (curr.team !== null)
          acc[curr.team] += `*${curr.name}* :small_orange_diamond: `;
        return acc;
      }, pugTeams);

    const activeTeams = Object.values(currTeams).reduce((acc, curr) => {
      acc += `${curr.slice(0, curr.length - 24)}\n`;
      return acc;
    }, ``);

    acc += `${turn}\n\n${players}\n\n${activeTeams}\n\n`;
    return acc;
  }, ``);
};

export const formatUserStats = (user: PugUser) => {
  if (isDocument(user.lastPug)) {
    const {
      lastPug: {
        game: { pug },
      },
    } = user;
    const { totalPugs, totalCaptain, totalWins, totalLosses } = Object.values(
      user.stats
    ).reduce(
      (acc, curr) => {
        acc.totalPugs += curr.totalPugs || 0;
        acc.totalCaptain += curr.totalCaptain || 0;
        acc.totalWins += curr.won || 0;
        acc.totalLosses += curr.lost || 0;
        return acc;
      },
      {
        totalPugs: 0,
        totalCaptain: 0,
        totalWins: 0,
        totalLosses: 0,
        totalWinRate: 0,
        totalGameTypes: 0,
      }
    );
    const title = `:pencil: Showing stats for **${user.username}** :pencil:`;
    const totals = `:video_game: **${totalPugs}** pug${
      totalPugs !== 1 ? 's' : ''
    }\t:cop: **${totalCaptain}**\t:trophy: **${totalWins}**\t:x: **${totalLosses}**`;
    const distance = formatDistanceStrict(new Date(), user.lastPug.timestamp, {
      addSuffix: true,
    });

    const pugTeams = !isDuelPug(pug.pickingOrder)
      ? Array.from({ length: pug.noOfTeams }, (_, i) => i).reduce(
          (acc, _, i) => {
            const teamIndex = getTeamIndex(i);
            acc[i] = `\t**${teams[teamIndex]}** ${teamEmojis[teamIndex]} `;
            return acc;
          },
          {} as { [key: string]: string }
        )
      : null;

    const currTeams = !isDuelPug(pug.pickingOrder)
      ? pug.players
          .slice()
          .sort((a, b) => Number(a.pick) - Number(b.pick))
          .reduce((acc, curr) => {
            if (curr.team !== null)
              acc![curr.team] += `*${curr.name}* :small_orange_diamond:`;
            return acc;
          }, pugTeams)
      : null;

    const activeTeams = !isDuelPug(pug.pickingOrder)
      ? Object.values(currTeams!).reduce((acc, curr) => {
          acc += `${curr.slice(0, curr.length - 24)}\n`;
          return acc;
        }, ``)
      : `${pug.players[0].name} :people_wrestling: ${pug.players[1].name}\n`;

    const lastMetaData = `Last pug played was **${pug.name.toUpperCase()}** (${distance})`;
    const collectiveStatsTitle = `**GameTypes**`;
    const collectiveStatsBody = Object.entries(user.stats).reduce(
      (acc, [pugName, pugStats]) => {
        const won = pugStats.won || 0;
        const lost = pugStats.lost || 0;
        const winPercentage = pugStats.won
          ? pugStats.won / (pugStats.won + pugStats.lost)
          : 0;
        acc += `**${pugName.toUpperCase()}**\t**${pugStats.totalPugs}** pug${
          pugStats.totalPugs !== 1 ? 's' : ''
        }\t:cop: **${pugStats.totalCaptain}**\t:star: ${
          pugStats.rating === 0
            ? `**no rating**`
            : `**${pugStats.rating.toFixed(2)}**`
        }\t:trophy: **${won}**\t:x: **${lost}**\t:muscle: **${(
          winPercentage * 100
        ).toFixed(2)}%**\n`;
        return acc;
      },
      ``
    );
    return `${title}\n\n${totals}\n\n${lastMetaData}\n${activeTeams}\n${collectiveStatsTitle}\n${collectiveStatsBody}`;
  }
  return `Not Found`;
};

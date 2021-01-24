import { User, MessageEmbed } from 'discord.js';
import { isDocument } from '@typegoose/typegoose';
import { Pug, User as PugUser, PugSchema, QueryServer, Log } from '~models';
import {
  CONSTANTS,
  emojis,
  teamEmojis,
  teams,
  isDuelPug,
  sanitizeName,
  padNumberWithZeros,
  getTeamNumericIndex,
} from '~utils';
import { formatDistanceToNowStrict } from 'date-fns';

const EMBED_COLOR = '#16171A';
const edges = [
  {
    top: `+----- mapvote ------+`,
    bottom: `+----------------------+`,
  },
  {
    top: `+------ mapvote ------+`,
    bottom: `+-----------------------+`,
  },
  {
    top: `+------- mapvote -------+`,
    bottom: `+-------------------------+`,
  },
  {
    top: `+------- mapvote ------+`,
    bottom: `+------------------------+`,
  },
];

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
  reason?: 'offline' | 'left'
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

  let reasonMsg;
  if (reason === 'offline') reasonMsg = 'because the user went offline';
  else if (reason === 'left')
    reasonMsg = 'because the user left this discord server';
  else reasonMsg = '';

  return `${left.length > 0 ? `${username} left  ${left} ${reasonMsg}` : ``}${
    nj.length > 0 ? `\n${nj}` : ``
  }${nj.length > 0 ? `\n${nf}` : ``}`;
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
    acc[i] = `**${teams[teamIndex]}** ${teamEmojis[teamIndex]} `;
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
      lastPug,
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
    const distance = formatDistanceToNowStrict(lastPug.timestamp, {
      addSuffix: true,
    });

    const lastPugTitle = `Last pug played was **${pug.name.toUpperCase()}** (${distance})`;
    const lastPugBody = formatLastPug(lastPug, 1, '');

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
    return `${title}\n\n${totals}\n\n${lastPugTitle}\n\n${lastPugBody}\n${collectiveStatsTitle}\n${collectiveStatsBody}`;
  }
  return `Not Found`;
};

export const formatLastPug = (
  lastPug: PugSchema,
  tCount: number,
  guildName: string
) => {
  const {
    game: { pug, coinFlipWinner },
  } = lastPug;
  const distance = formatDistanceToNowStrict(lastPug.timestamp, {
    addSuffix: true,
  });

  const pugTeams = !isDuelPug(pug.pickingOrder)
    ? Array.from({ length: pug.noOfTeams }, (_, i) => i).reduce((acc, _, i) => {
        const teamIndex = getTeamIndex(i);
        acc[i] = `**${teams[teamIndex]}** ${teamEmojis[teamIndex]} `;
        return acc;
      }, {} as { [key: string]: string })
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
        acc += `${curr.slice(0, curr.length - 23)}\n`;
        return acc;
      }, ``)
    : `**${pug.players[0].name}** :people_wrestling: **${pug.players[1].name}**\n`;

  const mapvoteWinnerTeam =
    typeof coinFlipWinner === 'number'
      ? `${formatMapvoteWinner(coinFlipWinner)}\n`
      : ``;

  if (guildName) {
    const title = `Last${
      tCount > 1 ? tCount : ''
    } **${pug.name.toUpperCase()}** at **${guildName}** (${distance})`;
    return `${title}\n\n${activeTeams}\n${mapvoteWinnerTeam}`;
  } else {
    return `${activeTeams}${mapvoteWinnerTeam}`;
  }
};

export const formatMapvoteWinner = (team: number) => {
  const { top, bottom } = edges[team];
  const winningTeam = teams[getTeamIndex(team)].toUpperCase();
  const winningTeamEmoji = teamEmojis[getTeamIndex(team)];
  const mapvoteWinnerTeam = `${winningTeamEmoji} **${winningTeam}** ${winningTeamEmoji}`;
  return `${top}\n| ${mapvoteWinnerTeam} |\n${bottom}`;
};

export const formatPromoteAvailablePugs = (
  pugs: Array<Pug>,
  guildName: string
) => {
  const title = `@here in **${guildName}**`;
  const sortedPugs = pugs.slice().sort((a, b) => {
    const neededForA = a.noOfPlayers - a.players.length;
    const neededForB = b.noOfPlayers - b.players.length;
    return neededForA - neededForB;
  });
  const body = sortedPugs.reduce((acc, curr) => {
    if (!curr.isInPickingMode) {
      acc += `**${
        curr.noOfPlayers - curr.players.length
      }** more needed for **${curr.name.toUpperCase()}**\n`;
    }
    return acc;
  }, ``);
  return `${title}\n${body}`;
};

type InfoType = Record<string, string>;
type PlayersType = Record<string, string>;
export const formatQueryServerStatus = (
  info: InfoType,
  players: PlayersType,
  { host, port, password }: { host: string; port: number; password: string }
) => {
  const embed = new MessageEmbed();

  const noOfPlayers = parseInt(info.numplayers) || 0;
  const maxPlayers = parseInt(info.maxplayers);
  const maxTeams = parseInt(info.maxteams);
  const timeLimit = parseInt(info.timelimit);
  const isTeamGame = !!info.maxteams;

  let playerList: Record<string, string[]> = {
    [teams.team_0]: [],
    [teams.team_1]: [],
    [teams.team_2]: [],
    [teams.team_3]: [],
    [teams.team_255]: [],
    [teams.spec]: [],
  };

  for (let i = 0; i < noOfPlayers; i++) {
    const playerFlag =
      players[`countryc_${i}`] && players[`countryc_${i}`] !== 'none'
        ? `:flag_${players[`countryc_${i}`]}:`
        : `:flag_white:`;

    const player = `${playerFlag} ${sanitizeName(players[`player_${i}`])}`;
    if (players[`mesh_${i}`] === 'Spectator') {
      playerList[teams.spec].push(player);
      continue;
    }

    if (isTeamGame) {
      const team = parseInt(players[`team_${i}`]);
      playerList[Object.values(teams)[team]].push(player);
    } else {
      playerList[teams.team_255].push(player);
    }
  }

  let xServerQueryProps: { remainingTime: string; teamScores: string[] } = {
    remainingTime: ``,
    teamScores: [],
  };
  if (info.xserverquery) {
    const time = parseInt(info.remainingtime);
    const seconds = time % 60;
    const minutes = (time - seconds) / 60;

    let teamScores = {
      [teams.team_0]: '',
      [teams.team_1]: '',
      [teams.team_2]: '',
      [teams.team_3]: '',
    };

    for (let i = 0; i < maxTeams; i++)
      teamScores[Object.values(teams)[i]] = info[`teamscore_${i}`];

    const isNotOverTime =
      (minutes === timeLimit && seconds === 0) || minutes < timeLimit;
    xServerQueryProps.remainingTime = `${padNumberWithZeros(
      minutes
    )}:${padNumberWithZeros(seconds)} ${
      isNotOverTime ? 'remaining' : '(overtime)'
    }\n`;
    xServerQueryProps.teamScores = Object.keys(teamScores).reduce(
      (acc, curr) => {
        const index = getTeamNumericIndex(curr);
        acc[index] = ` • ${teamScores[curr]}`;
        return acc;
      },
      [] as string[]
    );
  }

  Object.keys(playerList).forEach((team) => {
    const teamIndex = getTeamNumericIndex(team);
    const teamPlayers = playerList[team].reduce((acc, curr) => {
      if (team === teams.spec) acc += curr + ' • ';
      else acc += curr + ' ' + '\n';
      return acc;
    }, ``);

    playerList[team].length > 0
      ? embed.addField(
          team + (xServerQueryProps.teamScores[teamIndex] || ``),
          teamPlayers,
          team !== teams.spec
        )
      : '';
  });

  const description = `${
    info.mapname
  } • ${noOfPlayers}/${maxPlayers} players • ${
    xServerQueryProps.remainingTime || ''
  }`;
  const footer = `unreal://${host}:${port}${
    password ? `?password=${password}` : ``
  }`;

  embed.setTitle(info.hostname);
  embed.setColor(EMBED_COLOR);
  embed.setDescription(description);
  embed.setFooter(footer);

  return embed;
};

type Responses = Array<
  | {
      info: InfoType;
      players: PlayersType;
    }
  | undefined
>;
export const formatQueryServers = (
  list: Array<QueryServer>,
  responses: Responses
) => {
  const { ipname, players } = list.reduce(
    (acc, curr, i) => {
      const response = responses[i];
      acc.ipname.push(`\`${i + 1}\`\u00A0${curr.name}`);

      acc.players.push(
        response
          ? `\`${response.info.numplayers}/${response.info.maxplayers}\``
          : '`Timed Out`'
      );
      return acc;
    },
    {
      ipname: [],
      players: [],
    } as { ipname: string[]; players: string[] }
  );

  const embed = new MessageEmbed();
  embed.setColor(EMBED_COLOR);

  if (list.length > 0) {
    embed.addField(`IP\u00A0\u00A0\u00A0Name`, ipname, true);
    embed.addField('Players', players, true);
    embed.setFooter('To query a server, type .q ip');
  } else {
    embed.setDescription('No query servers added yet');
  }

  return embed;
};

export const formatUserLogs = (logs: Array<Log>) =>
  logs.reduce((acc, curr) => {
    acc += `${curr.description} on ${curr.timestamp.toUTCString()}\n`;
    return acc;
  }, ``);

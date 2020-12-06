import { User } from 'discord.js';
import { Pug } from '~models';
import { CONSTANTS, emojis, teamEmojis, teams } from '~utils';

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
        curr.tag ? `[${curr.tag}]` : ``
      }`;
    }
    return acc;
  }, `Players: `);

  return `${pugCaptains}\n${turn}\n${nonCaptainPlayers}`;
};

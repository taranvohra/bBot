import { Pug } from '~models';
import { emojis } from '~utils';

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
      acc.username = user?.username ?? '';
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

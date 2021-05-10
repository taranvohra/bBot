import log from '../log';
import fs from 'fs';
import Jimp from 'jimp';
import { formatDistance } from 'date-fns';
import { User } from 'discord.js';
import { Pug, Users, Pugs, GuildStats } from '~/models';
import {
  computePickingOrder,
  CONSTANTS,
  emojis,
  getRandomInt,
  sanitizeName,
  calculateBlockExpiry,
  isDuelPug,
  getRandomPickIndex,
  teamEmojiTypes,
} from '~/utils';
import {
  addGuildGameType,
  deleteGuildGameType,
  getNextSequences,
  updateStatsAfterPug,
  getLastXPug,
  addGuildBlockedUser,
  removeGuildBlockedUser,
  setGuildGameTypeCoinFlipTo,
  updateGuildUserDefaultJoins,
  createNewUserLog,
  updateGuildGameTypeTeamEmojis,
} from '~/actions';
import store, {
  addGameType,
  removeGameType,
  addPug,
  removePug,
  addCommandCooldown,
  addBlockedUser,
  removeBlockedUser,
  enableCoinFlip,
  disableCoinFlip,
  updateTeamEmojis,
} from '~/store';
import {
  formatPugFilledDM,
  formatJoinStatus,
  formatLeaveStatus,
  formatDeadPugs,
  formatBroadcastPug,
  formatListGameType,
  formatListGameTypes,
  formatListAllCurrentGameTypes,
  formatAddCaptainStatus,
  formatPickPlayerStatus,
  formatCoinFlipMapvoteWinner,
  formatPugsInPicking,
  formatUserStats,
  formatLastPug,
  formatPromoteAvailablePugs,
  formatPugStats,
} from '../formatting';
import { pugPubSub } from '../pubsub';
import { FONTS } from '../fonts';

export const handleAddGameType: Handler = async (message, args) => {
  log.info(`Entering handleAddGameType`);
  const { guild } = message;
  if (!guild) return;

  const guildId = guild.id;
  const cache = store.getState();
  const pugs = cache.pugs[guild.id];
  if (!pugs) return;

  const { gameTypes } = pugs;

  let isMix = false;
  let noOfTeams: number;

  const [name, noOfPlayers, noOfTeamsOrMix] = [
    args[0].toLowerCase(),
    Number(args[1]),
    args[2],
  ];

  console.log({ noOfTeamsOrMix });

  if (!name || isNaN(noOfPlayers) || !noOfTeamsOrMix) {
    message.channel.send(`Invalid usage of command`);
    return;
  }

  if (Number.isInteger(parseInt(noOfTeamsOrMix))) {
    // Number of teams provided
    noOfTeams = parseInt(noOfTeamsOrMix);
    if (noOfTeams < 1 || noOfTeams > 4) {
      message.channel.send(
        `No. of teams has to be greater than 0 and less than 5`
      );
      return;
    }
  } else if (noOfTeamsOrMix === 'mix') {
    // mix gametype
    // we set number of teams to 1 because we don't know how many teams there will be
    // but we will add an additional boolean with the gametype
    noOfTeams = 1;
    isMix = true;
  } else {
    message.channel.send(
      `Either send number of teams or "mix" (without quotes)`
    );
    return;
  }

  if (gameTypes.some((g) => g.name === name)) {
    log.debug(`Gametype ${name} already exists`);
    message.channel.send(`Gametype with name ${name} already exists`);
    return;
  }

  const pickingOrder = computePickingOrder(noOfPlayers, noOfTeams, isMix);
  if (pickingOrder === null) {
    log.debug(
      `Picking order cannot be computed from ${noOfPlayers} players and ${noOfTeams} teams`
    );
    message.channel.send(
      `Invalid number of players/teams. Picking order cannot be computed`
    );
    return;
  }

  const newGameType = {
    name,
    noOfPlayers,
    noOfTeams,
    pickingOrder,
    isCoinFlipEnabled: false,
    isMix,
    teamEmojis: 'logos',
  } as const;

  await addGuildGameType(guildId, newGameType);
  log.info(`Added new gametype ${name} to guild ${guildId}`);

  store.dispatch(addGameType({ ...newGameType, guildId }));

  message.channel.send(`**${name}** has been added`);
  log.info(`Exiting handleAddGameType`);
};

export const handleDeleteGameType: Handler = async (message, args) => {
  log.info(`Entering handleDeleteGameType`);
  const { guild } = message;
  if (!guild) return;

  const cache = store.getState();
  const pugs = cache.pugs[guild.id];
  if (!pugs) return;

  const { gameTypes, list } = pugs;

  const name = args[0].toLowerCase();

  if (!name) {
    message.channel.send(`Invalid usage of command`);
    return;
  }

  if (!gameTypes.some((g) => g.name === name)) {
    log.debug(`Gametype ${name} does not exist`);
    message.channel.send(`Gametype with name ${name} does not exist`);
    return;
  }

  const potentialActivePug = list.find((p) => p.name === name);
  if (potentialActivePug) {
    log.debug(
      `Cannot delete gametype ${name} because there could be a potential pug`
    );
    message.channel.send(
      `Gametype ${name} cannot be deleted. Clear the pug first`
    );
    return;
  }

  await deleteGuildGameType(guild.id, name);
  log.info(`Deleted gametype ${name} from guild ${guild.id}`);

  store.dispatch(removeGameType({ guildId: guild.id, name }));

  message.channel.send(`**${name}** has been deleted`);
  log.info(`Exiting handleDeleteGameType`);
};

export const handleDecideDefaultOrSpecificJoin: Handler = async (
  message,
  args
) => {
  log.info(`Entering handleDecideDefaultOrSpecificJoin`);
  const { guild, author } = message;
  if (!guild) return;

  if (args.length > 0) {
    handleJoinGameTypes(message, args);
  } else {
    const user = await Users.findOne({
      userId: author.id,
      guildId: guild.id,
    }).exec();

    if (!user || !user.defaultJoins || user.defaultJoins.length === 0) {
      message.channel.send(
        `No defaultjoins set. Type **${CONSTANTS.defaultPrefix}defaultjoin gametypes** to set it!`
      );
      return;
    }
    handleJoinGameTypes(message, user.defaultJoins);
  }
  log.info(`Exiting handleDecideDefaultOrSpecificJoin`);
};

export const handleSetDefaultJoin: Handler = async (message, args) => {
  log.info(`Entering handleSetDefaultJoin`);
  const { guild, author } = message;
  if (!guild) return;

  const cache = store.getState();
  const pugs = cache.pugs[guild.id];
  if (!pugs) return;

  const { gameTypes } = pugs;

  const allJoins = args
    .map((a) => {
      const game = a.toLowerCase();
      const gameType = gameTypes.some((g) => g.name === game);
      if (!gameType) return undefined;
      return game;
    })
    .filter((j): j is string => !!j);

  if (allJoins.length > 0) {
    await updateGuildUserDefaultJoins(
      guild.id,
      author.id,
      author.username,
      allJoins
    );
    log.info(
      `Updated default joins for user ${author.id} at guild ${guild.id}`
    );
    message.channel.send(`Default join set!`);
  }

  log.info(`Exiting handleSetDefaultJoin`);
};

export const handleJoinGameTypes: Handler = async (
  message,
  args,
  mentioned
) => {
  log.info(`Entering handleJoinGameTypes`);
  const { guild, author } = message;
  if (!guild) return;

  const user = mentioned || author;
  const cache = store.getState();
  const pugs = cache.pugs[guild.id];
  const blocks = cache.blocks[guild.id];
  if (!pugs || !blocks) return;

  const { gameTypes, list } = pugs;
  const { list: blockedList } = blocks;

  const isInvisible = message.author.presence.status === 'offline';
  if (isInvisible) {
    message.channel.send(`You cannot join pugs while being invisible`);
    return;
  }

  const block = blockedList.find((b) => b.culprit.id === user.id);
  if (block) {
    log.debug(
      `${user.id} cannot join pugs on ${guild.id} because they are blocked`
    );
    message.channel.send(
      `**${
        user.username
      }** is blocked from joining pugs. Block expires in **${formatDistance(
        new Date(),
        new Date(block.expiresAt)
      )}**`
    );
    return;
  }

  const isPartOfFilledPug = list.find(
    (p) => p.isInPickingMode && p.players.some((u) => u.id === user.id)
  );
  if (isPartOfFilledPug) {
    log.debug(
      `${user.id} needs to leave ${isPartOfFilledPug.name} on ${guild.id} first to join other pugs`
    );
    message.channel.send(
      `Please leave **${isPartOfFilledPug.name.toUpperCase()}** first to join other pugs`
    );
    return;
  }

  const dbUser = await Users.findOne({
    userId: user.id,
    guildId: guild.id,
  }).exec();

  let toBroadcast: Pug | undefined;
  const joinStatuses = args
    .map((a) => a.toLowerCase())
    .map((game): JoinStatus | undefined => {
      if (!toBroadcast) {
        // Getting fresh cache everytime
        const cache = store.getState();
        const pugs = cache.pugs[guild.id];
        if (!pugs) return;

        const { list } = pugs;

        let result: JoinStatus['result'];
        const gameType = gameTypes.find((g) => g.name === game);
        if (!gameType) {
          result = 'not-found';
          return { name: game, result };
        }

        const existingPug = list.find((p) => p.name === game);
        const pug = existingPug ?? new Pug(gameType);

        const pickingStatusBeforeJoining = pug.isInPickingMode;

        if (pug.isInPickingMode) {
          log.debug(
            `${user.id} cannot join ${pug.name} on ${guild.id} because it is already filled`
          );
          result = 'full';
        } else if (pug.players.find((p) => p.id === user.id)) {
          log.debug(
            `${user.id} cannot join ${pug.name} on ${guild.id} because they are already in`
          );
          result = 'present';
        } else {
          const gameTypeStats = dbUser?.stats?.[game] ?? {
            lost: 0,
            won: 0,
            totalPugs: 0,
            totalCaptain: 0,
            rating: 0,
          };
          pug.addPlayer({
            id: user.id,
            name: user.username,
            stats: { [game]: gameTypeStats },
          });
          result = 'joined';
          log.info(`${user.id} joined ${pug.name} on ${guild.id}`);
        }

        if (pug.players.length === pug.noOfPlayers && !pug.isInPickingMode) {
          pug.fillPug(guild.id);
          log.info(`Filled pug ${pug.name} on ${guild.id}`);
        }

        const pickingStatusAfterJoining = pug.isInPickingMode;
        if (!pickingStatusBeforeJoining && pickingStatusAfterJoining) {
          toBroadcast = pug;
        }

        if (!existingPug && result === 'joined') {
          log.debug(`Adding ${pug.name} to store for guild ${guild.id}`);
          store.dispatch(addPug({ guildId: guild.id, pug }));
        }
        return { name: game, user, pug, result };
      }
    });

  message.channel.send(
    formatJoinStatus(joinStatuses.filter(Boolean) as JoinStatus[])
  );

  if (toBroadcast) {
    let allLeaveMsgs = ``;
    for (let i = 0; i < list.length; i++) {
      const otherPug = list[i];
      if (otherPug.name !== toBroadcast.name) {
        let allPugLeaveMsgs = ``;
        for (let j = 0; j < toBroadcast.players.length; j++) {
          const player = toBroadcast.players[j];
          if (otherPug.players.find((p) => p.id === player.id)) {
            const user = message.client.users.cache.get(player.id);
            const msg = await handleLeaveGameTypes(
              message,
              [otherPug.name],
              user,
              true
            );
            allPugLeaveMsgs += `${msg} `;
          }
        }
        allLeaveMsgs += `${allPugLeaveMsgs} \n`;
      }
    }

    if (allLeaveMsgs) {
      message.channel.send(allLeaveMsgs);
    }

    message.channel.send(formatBroadcastPug(toBroadcast));

    /*
     * Send DM to each player that pug fileld
     */
    const DM = formatPugFilledDM(toBroadcast, guild.name);
    toBroadcast.players.forEach((player) => {
      const user = message.client.users.cache.get(player.id);
      user?.send(DM);
    });

    // If 1v1 or mix pug, there wont be live picking
    // so end the pug and update stats
    if (isDuelPug(toBroadcast.pickingOrder) || toBroadcast.isMix) {
      const sequences = await getNextSequences(guild.id, toBroadcast.name);
      if (!sequences) {
        throw new Error(
          `No sequences were returned for ${toBroadcast.name} at ${guild.id}`
        );
      }

      const newPug = await Pugs.create({
        guildId: guild.id,
        name: toBroadcast.name,
        timestamp: new Date(),
        gameSequence: sequences.current,
        overallSequence: sequences.total,
        game: {
          pug: toBroadcast,
        },
      });

      updateStatsAfterPug(toBroadcast, newPug.id, guild.id);

      log.debug(`Saved stats for players in pug ${newPug.id}`);
      log.debug(
        `Remove pug ${toBroadcast.name} at guild ${guild.id} from store`
      );
      store.dispatch(removePug({ guildId: guild.id, name: toBroadcast.name }));
    }
  }

  log.info(`Exiting handleJoinGameTypes`);
};

export const handleLeaveGameTypes: Handler = async (
  message,
  args,
  mentioned,
  returnMsg
) => {
  log.info(`Entering handleLeaveGameTypes`);
  const { guild, author, content } = message;
  if (!guild) return;

  const user = mentioned || author;

  const cache = store.getState();
  const pugs = cache.pugs[guild.id];
  if (!pugs) return;

  const { gameTypes } = pugs;

  if (args.length === 0) {
    message.channel.send(`Invalid, no pugs were mentioned`);
    return;
  }

  const leaveStatuses = args
    .map((a) => a.toLowerCase())
    .map((game): LeaveStatus | undefined => {
      // Getting fresh cache everytime
      const cache = store.getState();
      const pugs = cache.pugs[guild.id];
      if (!pugs) return;

      const { list } = pugs;

      let result: LeaveStatus['result'];
      const gameType = gameTypes.find((g) => g.name === game);
      if (!gameType) {
        result = 'not-found';
        return { name: game, result };
      }

      const pug = list.find((p) => p.name === game);
      if (!pug) return { name: game, result: 'not-found' };

      const indexOfPlayerInPug = pug.players.findIndex((u) => u.id === user.id);
      const isInPug = indexOfPlayerInPug !== -1;

      if (isInPug) {
        pug.removePlayer(user.id);
        log.info(`Removed user ${user.id} from ${game} in ${guild.id}`);

        if (indexOfPlayerInPug === 0 && pug.isMix) {
          pug.players = [];
          message.channel.send(
            `**${pug.name.toUpperCase()}** will be abandoned because the first person in the list left`
          );
        }

        if (pug.isInPickingMode) {
          pug.stopPug();
          log.info(`Stopped pug ${game} at ${guild.id}`);
        }
        result = 'left';
        return {
          name: game,
          result,
          pug,
          user,
        };
      } else {
        result = 'not-in';
        return { name: game, result };
      }
    });

  const allLeaveStatuses = leaveStatuses.filter(Boolean) as LeaveStatus[];
  // Compute dead pugs
  const deadPugs = allLeaveStatuses.reduce((acc, { pug, user }) => {
    if (pug && user) {
      if (pug.players.length === pug.noOfPlayers - 1) {
        acc.push({ pug, user });
      }
      if (pug.isEmpty()) {
        store.dispatch(removePug({ guildId: guild.id, name: pug.name }));
        log.info(
          `Removed pug ${pug.name} at guild ${guild.id} because there are 0 players in`
        );
      }
    }
    return acc;
  }, [] as { pug: Pug; user: User }[]);

  const leaveMessage = formatLeaveStatus(
    allLeaveStatuses,
    content === 'zzz' ? 'offline' : content === 'left' ? 'left' : undefined
  );

  if (!returnMsg) {
    message.channel.send(leaveMessage);
    deadPugs.length > 0 && message.channel.send(formatDeadPugs(deadPugs));
  } else {
    // Displaying dead pug first because we're returning the message after that
    deadPugs.length > 0 && message.channel.send(formatDeadPugs(deadPugs));
    return leaveMessage;
  }

  log.info(`Exiting handleLeaveGameTypes`);
};

export const handleListGameTypes: Handler = async (message, args) => {
  log.info(`Entering handleListGameTypes`);
  const { guild } = message;
  if (!guild) return;

  const cache = store.getState();
  const pugs = cache.pugs[guild.id];
  if (!pugs) return;

  const { gameTypes, list } = pugs;
  const [gameType] = args;

  if (gameType) {
    const name = gameType.toLowerCase();
    const validGameType = gameTypes.find((g) => g.name === name);
    if (!validGameType) {
      log.debug(`No such gametype ${name} at guild ${guild.id}`);
      message.channel.send(`There is no such gametype **${name}**`);
      return;
    }

    const pug = list.find((p) => p.name === name);
    if (!pug) {
      message.channel.send(
        `**${name.toUpperCase()}** (0/${validGameType.noOfPlayers})`
      );
      return;
    }
    message.channel.send(formatListGameType(pug));
  } else {
    const tempList = gameTypes.map((g) => ({
      name: g.name,
      currPlayers: 0,
      maxPlayers: g.noOfPlayers,
    }));

    const gamesList = tempList.reduce((acc, curr) => {
      const existingPug = list.find((p) => p.name === curr.name);
      if (existingPug) {
        acc.push({
          name: existingPug.name,
          currPlayers: existingPug.players.length,
          maxPlayers: existingPug.noOfPlayers,
        });
      } else acc.push(curr);
      return acc;
    }, [] as typeof tempList);

    message.channel.send(formatListGameTypes(gamesList, guild.name));
  }
  log.info(`Exiting handleListGameTypes`);
};

export const handleListAllCurrentGameTypes: Handler = async (message) => {
  log.info(`Entering handleListAllCurrentGameTypes`);
  const { guild } = message;
  if (!guild) return;

  const cache = store.getState();
  const pugs = cache.pugs[guild.id];
  if (!pugs) return;

  const { list } = pugs;

  message.channel.send(formatListAllCurrentGameTypes(list, guild.name));

  log.info(`Exiting handleListAllCurrentGameTypes`);
};

export const handleLeaveAllGameTypes: Handler = async (message) => {
  log.info(`Entering handleLeaveAllGameTypes`);
  const { guild, author } = message;
  if (!guild) return;

  const cache = store.getState();
  const pugs = cache.pugs[guild.id];
  if (!pugs) return;

  const { list } = pugs;

  const listToLeave = list
    .filter((pug) => pug.players.find((p) => p.id === author.id))
    .map((pug) => pug.name);

  if (listToLeave.length === 0) {
    message.channel.send(
      `Cannot leave pug(s) if you haven't joined any ${emojis.smart}`
    );
    return;
  }

  handleLeaveGameTypes(message, listToLeave);
  log.info(`Exiting handleLeaveAllGameTypes`);
};

export const handleAddCaptain: Handler = async (message) => {
  log.info(`Entering handleAddCaptain`);
  const { guild, author } = message;
  if (!guild) return;

  const cache = store.getState();
  const pugs = cache.pugs[guild.id];
  if (!pugs) return;

  const { list } = pugs;

  const forPug = list.find((pug) => {
    const isCandidate = pug.isInPickingMode && !pug.areCaptainsDecided();
    if (isCandidate) {
      return pug.players.some((p) => p.id === author.id);
    }
    return false;
  });

  if (!forPug) {
    message.channel.send(`There was no filled pug for which you could captain`);
    return;
  }

  if (forPug.captains.includes(author.id)) {
    message.channel.send(`**${author.username}** is already a captain`);
    return;
  }

  forPug.addCaptain(author.id);
  const assignedTeam = forPug.captains.findIndex((c) => c === author.id);
  log.info(
    `Added captain ${author.username} for pug ${forPug.name} at ${guild.id}`
  );

  message.channel.send(
    formatAddCaptainStatus(author.username, assignedTeam, forPug)
  );

  if (forPug.areCaptainsDecided()) {
    pugPubSub.emit('captains_ready', guild.id, forPug.name);
  }
  log.info(`Entering handleAddCaptain`);
};

export const handlePickPlayer: Handler = async (
  message,
  [index, index2],
  mentionedUser
) => {
  log.info(`Entering handlePickPlayer`);
  const { guild, author } = message;
  if (!guild) return;

  const cache = store.getState();
  const pugs = cache.pugs[guild.id];
  if (!pugs) return;

  const { list, gameTypes } = pugs;
  const user = mentionedUser ? mentionedUser : author;

  const forPug = list.find((pug) => {
    if (pug.isInPickingMode) {
      return pug.isCaptain(user.id);
    }
    return false;
  });

  if (!forPug) {
    message.channel.send(
      `Cannot pick if you are not a captain in a pug ${emojis.smart}`
    );
    return;
  }

  if (!forPug.areCaptainsDecided()) {
    message.channel.send(`Please wait until all captains have been decided`);
    return;
  }

  const team = forPug.captains.findIndex((u) => u === user.id);
  const { pickingOrder, turn, name } = forPug;

  if (team !== pickingOrder[turn]) {
    message.channel.send(`Please wait for your turn :pouting_cat:`);
    return;
  }

  let pick1: number, pick2: number | undefined;
  let lastPickedPlayerIndex: number | null;

  const canPickTwice = pickingOrder[turn + 1] === team; // next turn is same team pick

  // +1 because few lines down we're going to subtract -1 so we still gucci 😎
  const playerIndex =
    index === 'random'
      ? getRandomPickIndex(forPug.players) + 1
      : parseInt(index);
  if (!playerIndex) return;

  if (playerIndex < 1 || playerIndex > forPug.players.length) {
    message.channel.send(`Invalid pick`);
    return;
  }

  if (forPug.players[playerIndex - 1].team !== null) {
    const alreadyPicked = forPug.players[playerIndex - 1];
    message.channel.send(`${alreadyPicked.name} is already picked`);
    return;
  }

  const { lastPlayerIndex } = forPug.pickPlayer(
    playerIndex - 1,
    pickingOrder[turn]
  );
  pick1 = playerIndex - 1;
  lastPickedPlayerIndex = lastPlayerIndex;

  /**
   * Situation when captain picks two in a row
   */
  const playerIndex2 =
    index2 === 'random'
      ? getRandomPickIndex(forPug.players) + 1
      : parseInt(index2);

  if (canPickTwice && playerIndex2) {
    let if1 = true,
      if2 = true;

    if (playerIndex2 < 1 || playerIndex2 > forPug.players.length) {
      message.channel.send(`Invalid second pick`);
      if1 = false;
    }

    if (if1 && forPug.players[playerIndex2 - 1].team !== null) {
      const alreadyPicked = forPug.players[playerIndex2 - 1];
      message.channel.send(`${alreadyPicked.name} is already picked`);
      if2 = false;
    }

    if (if1 && if2) {
      const { lastPlayerIndex } = forPug.pickPlayer(
        playerIndex2 - 1,
        pickingOrder[turn]
      );
      pick2 = playerIndex2 - 1;
      lastPickedPlayerIndex = lastPlayerIndex;
    }
  }

  const pickedPlayers = [
    pick1,
    pick2,
    lastPickedPlayerIndex,
  ].filter((i): i is number => Number.isInteger(i));
  message.channel.send(formatPickPlayerStatus(forPug, pickedPlayers) ?? '');

  if (!forPug.isInPickingMode) {
    const gameType = gameTypes.find((g) => g.name === name);
    if (!gameType) return;

    const { isCoinFlipEnabled } = gameType;
    const coinflip = getRandomInt(0, forPug.noOfTeams - 1);
    if (isCoinFlipEnabled) {
      message.channel.send(formatCoinFlipMapvoteWinner(coinflip, forPug));
    }

    const sequences = await getNextSequences(guild.id, forPug.name);
    if (!sequences) {
      throw new Error(
        `No sequences were returned for ${forPug.name} at ${guild.id}`
      );
    }

    const savedPug = await Pugs.create({
      guildId: guild.id,
      name: forPug.name,
      timestamp: new Date(),
      gameSequence: sequences.current,
      overallSequence: sequences.total,
      game: {
        pug: forPug,
        coinFlipWinner: isCoinFlipEnabled ? coinflip : undefined,
      },
    });
    log.debug(`Saved new pug ${savedPug.id} at ${guild.id} in DB`);

    updateStatsAfterPug(forPug, savedPug.id, guild.id);

    log.debug(`Saved stats for players in pug ${savedPug.id}`);
    log.debug(`Remove pug ${forPug.name} at guild ${guild.id} from store`);

    store.dispatch(removePug({ guildId: guild.id, name: forPug.name }));
  }

  log.info(`Exiting handlePickPlayer`);
};

export const handlePugPicking: Handler = async (message) => {
  log.info(`Entering handlePugPicking`);
  const { guild } = message;
  if (!guild) return;

  const cache = store.getState();
  const pugs = cache.pugs[guild.id];
  if (!pugs) return;

  const { list } = pugs;

  const pugsInPicking = list.filter(
    (pug) => pug.isInPickingMode && pug.areCaptainsDecided()
  );

  if (pugsInPicking.length === 0) {
    message.channel.send(`There are no pugs in picking mode`);
    return;
  }

  message.channel.send(formatPugsInPicking(pugsInPicking));
  log.info(`Exiting handlePugPicking`);
};

export const handleAddOrRemoveTag: Handler = async (message, args) => {
  log.info(`Entering handleAddOrRemoveTag`);
  const { guild, author } = message;
  if (!guild) return;

  const cache = store.getState();
  const pugs = cache.pugs[guild.id];
  if (!pugs) return;

  const { list } = pugs;
  const user = author;

  const isAddingTag = Boolean(args[0]);

  if (isAddingTag && args.join(' ').length > CONSTANTS.tagLength) {
    message.channel.send(
      `Tags must be shorter than ${CONSTANTS.tagLength} characters`
    );
    return;
  }

  const tag = sanitizeName(args.join(' '));
  const pugsUserIn = list.filter((pug) =>
    pug.players.find((p) => p.id === user.id)
  );

  if (pugsUserIn.length === 0) return;

  pugsUserIn.forEach((pug) => {
    isAddingTag ? pug.addTag(user.id, tag) : pug.removeTag(user.id);
  });

  isAddingTag
    ? message.channel.send(`Your new tag is: **${tag}**`)
    : message.channel.send(`Your tag has been removed`);

  log.info(`Exiting handleAddOrRemoveTag`);
};

export const handleCheckStats: Handler = async (message) => {
  log.info(`Entering handleCheckStats`);
  const { guild, author, mentions } = message;
  if (!guild) return;

  const mentionedUser = mentions.users.first();

  const user = await Users.findOne({
    userId: mentionedUser ? mentionedUser.id : author.id,
    guildId: guild.id,
  })
    .populate('lastPug')
    .exec();

  if (!user) {
    message.channel.send(
      `There are no stats logged for **${
        mentionedUser ? mentionedUser.username : author.username
      }**`
    );
    return;
  }
  message.channel.send(formatUserStats(user));

  log.info(`Exiting handleCheckStats`);
};

export const handleCheckLastPugs: Handler = async (message, args) => {
  log.info(`Entering handleCheckLastPugs`);
  const { guild } = message;
  if (!guild) return;
  if (!message.cmd) return;

  const { tCount, digits } = message.cmd.split('').reduce(
    (acc, curr) => {
      acc.tCount += curr === 't' ? 1 : 0;
      acc.digits += curr.match(/\d/g) ? curr : '';
      return acc;
    },
    { tCount: 0, digits: '' }
  );

  const digitsAfterT = parseInt(digits);

  if (tCount > 1 && digitsAfterT > 0) {
    message.channel.send(`Invalid usage of command`);
    return;
  }

  const howFar = digitsAfterT > 0 ? digitsAfterT : tCount;
  const gameType = args[0] ? args[0].toLowerCase() : '';

  const thatPug = await getLastXPug(guild.id, howFar, gameType);
  if (!thatPug) {
    message.channel.send(
      `No ${message.cmd} pug found ${
        gameType ? `for **${gameType.toUpperCase()}**` : ``
      }`
    );
    return;
  }

  message.channel.send(formatLastPug(thatPug, howFar, guild.name));
  log.info(`Exiting handleCheckLastPugs`);
};

export const handlePromoteAvailablePugs: Handler = async (message, args) => {
  log.info(`Entering handlePromoteAvailablePugs`);
  const { guild, member } = message;
  if (!guild || !member) return;

  const cache = store.getState();
  const pugs = cache.pugs[guild.id];
  const misc = cache.misc[guild.id];

  if (!pugs || !misc) return;

  const { list } = pugs;

  const hasCoolDownRole = member.roles.cache.some(
    (role) => role.name === 'COOLDOWN'
  );
  if (hasCoolDownRole) {
    const { cooldowns } = misc;
    const cooldownCmd = cooldowns['promote'];
    if (cooldownCmd) {
      const timeDiff = cooldownCmd - Date.now();
      if (timeDiff > 0) {
        message.channel.send(
          `COOLDOWN! You will be able to use this command after ${(
            timeDiff / 1000
          ).toFixed(0)} second${timeDiff / 1000 > 1 ? 's' : ''}`
        );
        return;
      }
    }
  }

  const hasPugMentioned = args[0]
    ? list.find((p) => p.name === args[0].toLowerCase())
    : undefined;

  if (
    hasPugMentioned &&
    hasPugMentioned.players.length > 0 &&
    !hasPugMentioned.isInPickingMode
  ) {
    message.channel.send(
      formatPromoteAvailablePugs([hasPugMentioned], guild.name)
    );
    return;
  }

  if (!hasPugMentioned && args.length === 0 && list.length > 0) {
    message.channel.send(formatPromoteAvailablePugs(list, guild.name));
  } else {
    if (args[0])
      message.channel.send(
        `There is no such active pug ${args[0]}. Try joining it maybe`
      );
    else
      message.channel.send(
        `There are no active pugs to promote. Try joining one!`
      );
  }

  if (hasCoolDownRole) {
    store.dispatch(
      addCommandCooldown({
        guildId: guild.id,
        command: 'promote',
        timestamp: Date.now() + CONSTANTS.coolDownSeconds * 1000,
      })
    );
  }

  log.info(`Exiting handlePromoteAvailablePugs`);
};

export const handleDecidePromoteOrPick: Handler = async (message, args) => {
  log.info(`Entering handleDecidePromoteOrPick`);
  const { guild, cmd } = message;
  if (!guild || !cmd) return;

  // just p or promote
  if (!args[0]) handlePromoteAvailablePugs(message, args);
  else {
    // p 4 or p siege5
    const cache = store.getState();
    const pugs = cache.pugs[guild.id];
    if (!pugs) return;

    const { gameTypes } = pugs;
    const isArgGameType = gameTypes.find(
      (g) => g.name === args[0].toLowerCase()
    );

    if (isArgGameType) handlePromoteAvailablePugs(message, args);
    else if (!isNaN(parseInt(args[0])) || args[0] === 'random')
      handlePickPlayer(message, args);
    else handlePromoteAvailablePugs(message, args);
  }
};

export const handleShowTop10Played: Handler = async (message, args) => {
  log.info(`Entering handleShowTop10Played`);
  const { guild } = message;
  if (!guild) return;

  const gameType = args[0].toLowerCase();
  if (!gameType) {
    message.channel.send(`No gametype was mentioned`);
    return;
  }

  const sortKey = `stats.${gameType}.totalPugs` as const;
  const top10Data = await Users.find({
    guildId: guild.id,
    [`stats.${gameType}`]: { $exists: true },
  })
    .sort({
      [sortKey]: -1,
    })
    .select('username stats')
    .limit(10)
    .exec();

  if (top10Data.length === 0) {
    log.debug(`No top10 played data for ${gameType} at guild ${guild.id}`);
    message.channel.send(`No data`);
    return;
  }

  const top10 = top10Data.map(({ username, stats }) => {
    const { totalPugs } = stats[gameType];
    return { username, totalPugs };
  });

  Jimp.read('assets/top10_played_template.png').then(async (template) => {
    const { arialFNT, obelixFNT, ubuntuFNT, ubuntuTTF } = await FONTS;
    let Y = 50;
    const MAX_HEIGHT = 25;

    template.print(
      obelixFNT,
      0,
      0,
      {
        text: `TOP 10 PLAYED ${gameType.toUpperCase()}`,
        alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
        alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE,
      },
      200,
      MAX_HEIGHT
    );

    top10.forEach((player, i) => {
      const { username, totalPugs } = player;
      const name = username.replace(/\\[^\\]/g, (c) => c.substring(1));

      const shouldUseUbuntu = name
        .split('')
        .every((_, i) => ubuntuTTF.hasGlyphForCodePoint(name.codePointAt(i)!));

      template.print(
        obelixFNT,
        0,
        Y,
        {
          text: (i + 1).toString(),
          alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
          alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE,
        },
        30,
        MAX_HEIGHT
      );

      template.print(
        shouldUseUbuntu ? ubuntuFNT : arialFNT,
        30,
        Y,
        {
          text: name.substring(0, 12),
          alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
          alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE,
        },
        120,
        MAX_HEIGHT
      );

      template.print(
        ubuntuFNT,
        150,
        Y,
        {
          text: totalPugs.toString(),
          alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
          alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE,
        },
        50,
        MAX_HEIGHT
      );

      Y += 25;
    });

    const imageName = Date.now();
    template.write(`generated/${imageName}.png`);

    await message.channel.send('', {
      files: [`generated/${imageName}.png`],
    });

    try {
      fs.unlinkSync(`generated/${imageName}.png`);
    } catch (error) {
      log.error(`Unlink error top10played`, error);
    }
  });

  log.info(`Exiting handleShowTop10Played`);
};

export const handleShowPugStats: Handler = async (message) => {
  log.info(`Entering handleShowPugStats`);
  const { guild } = message;
  if (!guild) return;

  const guildStats = await GuildStats.findById(guild.id).exec();
  if (!guildStats) {
    log.debug(`No guild stats for ${guild.id}`);
    message.channel.send(`No pug stats found`);
    return;
  }

  const firstPug = await Pugs.findOne({
    guildId: guild.id,
    overallSequence: 1,
  }).exec();

  message.channel.send(
    formatPugStats(guild.name, guildStats, firstPug ?? undefined)
  );

  log.info(`Exiting handleShowPugStats`);
};
/**
 * ADMIN
 *  COMMANDS
 */

export const handleAdminAddPlayer: Handler = async (message, args) => {
  log.info(`Entering handleAdminAddPlayer`);
  const { guild, mentions } = message;
  if (!guild) return;

  const mentionedUser = mentions.users.first();
  if (!mentionedUser) {
    message.channel.send(`No mentioned user`);
    return;
  }

  mentionedUser.username = sanitizeName(mentionedUser.username);
  handleJoinGameTypes(message, args.slice(1), mentionedUser);
  log.info(`Exiting handleAdminAddPlayer`);
};

export const handleAdminRemovePlayer: Handler = async (message, args) => {
  log.info(`Entering handleAdminRemovePlayer`);
  const { guild, mentions } = message;
  if (!guild) return;

  const mentionedUser = mentions.users.first();
  if (!mentionedUser) {
    message.channel.send(`No mentioned user`);
    return;
  }

  mentionedUser.username = sanitizeName(mentionedUser.username);
  handleLeaveGameTypes(message, args.slice(1), mentionedUser);
  log.info(`Exiting handleAdminRemovePlayer`);
};

export const handleAdminPickPlayer: Handler = async (message, args) => {
  log.info(`Entering handleAdminPickPlayer`);
  const { guild, mentions } = message;
  if (!guild) return;

  const mentionedUser = mentions.users.first();
  if (!mentionedUser) {
    message.channel.send(`No mentioned user`);
    return;
  }

  mentionedUser.username = sanitizeName(mentionedUser.username);
  handlePickPlayer(message, args.slice(1), mentionedUser);
  log.info(`Exiting handleAdminPickPlayer`);
};

export const handleAdminResetPug: Handler = async (message, args) => {
  log.info(`Entering handleAdminResetPug`);
  const { guild } = message;
  if (!guild) return;

  const cache = store.getState();
  const pugs = cache.pugs[guild.id];
  if (!pugs) return;

  const { list } = pugs;

  const pugName = args[0].toLowerCase();
  const pug = list.find((p) => p.name === pugName);
  if (!pug) {
    log.debug(
      `${pugName} could not be reset at guild ${guild.id} as it could not be found`
    );
    message.channel.send(`Cannot reset. Pug not found`);
    return;
  }

  if (!pug.isInPickingMode) {
    log.debug(
      `${pugName} could not be reset at guild ${guild.id} as it is not in picking mode yet`
    );
    message.channel.send(
      `**${pug.name.toUpperCase()}** is not in picking mode yet`
    );
    return;
  }

  pug.resetPug(guild.id);
  message.channel.send(formatBroadcastPug(pug));

  log.info(`Exiting handleAdminResetPug`);
};

export const handleAdminBlockPlayer: Handler = async (message, args) => {
  log.info(`Entering handleAdminBlockPlayer`);
  const { guild, mentions } = message;
  if (!guild) return;

  const mentionedUser = mentions.users.first();
  if (!mentionedUser) {
    message.channel.send(`No mentioned user`);
    return;
  }

  const cache = store.getState();
  const pugs = cache.pugs[guild.id];
  const blocks = cache.blocks[guild.id];
  if (!pugs || !blocks) return;

  const { list: pugList } = pugs;
  const { list } = blocks;

  if (list.some((u) => u.culprit.id === mentionedUser.id)) {
    log.debug(
      `User ${mentionedUser.username} is already blocked at guild ${guild.id}`
    );
    message.channel.send(
      `**${mentionedUser.username}** is already blocked from pugs`
    );
    return;
  }

  const [timeframe = '', ...reasonText] = args.slice(1);
  const [blockLengthString] = timeframe.match(/[0-9]+/g) ?? [];
  const [blockPeriodString] = timeframe.match(/[m|h|d]/g) ?? [];

  if (!blockLengthString || !blockPeriodString) {
    message.channel.send(`No duration was provided`);
    return;
  }

  const reason = reasonText.join(' ');
  if (!reason) {
    message.channel.send(`Specify the reason for block`);
    return;
  }

  const blockLength = parseInt(blockLengthString);
  if (blockLength <= 0) return;

  const expiry = calculateBlockExpiry(
    blockPeriodString as 'm' | 'h' | 'd',
    blockLength
  );

  const newBlock = {
    blockedOn: new Date(),
    by: {
      id: message.author.id,
      username: message.author.username,
    },
    culprit: {
      id: mentionedUser.id,
      username: mentionedUser.username,
    },
    expiresAt: expiry,
    reason,
  };

  await addGuildBlockedUser(guild.id, newBlock);

  log.info(`Blocked user ${mentionedUser.id} at guild ${guild.id}`);

  store.dispatch(
    addBlockedUser({
      guildId: guild.id,
      ...newBlock,
    })
  );

  // remove from pugs if joined
  let removedMsg = ``;
  let removedPugs = ``;
  for (let i = 0; i < pugList.length; i++) {
    if (pugList[i].players.find((p) => p.id === mentionedUser.id)) {
      const pugName = pugList[i].name;
      await handleLeaveGameTypes(message, [pugName], mentionedUser, true);
      removedPugs += `**${pugName.toUpperCase()}** `;
    }
  }

  if (removedPugs)
    removedMsg = `**${mentionedUser.username}** was removed from ${removedPugs}`;

  const finalMsg = `${emojis.bannechu} **${
    mentionedUser.username
  }** has been blocked from joining pugs till __**${expiry.toUTCString()}**__ ${
    emojis.bannechu
  } for reason ${reason}\n${removedMsg}`;

  const logDescription = `**BLOCKED** for reason: __${reason}__ by <@${message.author.id}>`;
  createNewUserLog(guild.id, mentionedUser.id, logDescription);

  message.channel.send(finalMsg);
  log.info(`Exiting handleAdminBlockPlayer`);
};

export const handleAdminUnblockPlayer: Handler = async (
  message,
  _,
  customMention
) => {
  log.info(`Entering handleAdminUnblockPlayer`);
  const { guild, mentions } = message;
  if (!guild) return;

  const mentionedUser = customMention ?? mentions.users.first();
  if (!mentionedUser) {
    message.channel.send(`No mentioned user`);
    return;
  }

  const cache = store.getState();
  const blocks = cache.blocks[guild.id];
  if (!blocks) return;

  const { list } = blocks;

  if (!list.some((u) => u.culprit.id === mentionedUser.id)) {
    message.channel.send(
      `Cannot unblock **${mentionedUser.username}** if the user isn't blocked in the first place ${emojis.smart}`
    );
    return;
  }

  await removeGuildBlockedUser(guild.id, mentionedUser.id);
  log.info(`Unblocked ${mentionedUser.id} at guild ${guild.id}`);

  store.dispatch(
    removeBlockedUser({
      guildId: guild.id,
      id: mentionedUser.id,
    })
  );

  message.channel.send(`**${mentionedUser.username}** has been unblocked`);
  log.info(`Exiting handleAdminUnblockPlayer`);
};

export const handleAdminShowBlockedPlayers: Handler = async (message, _) => {
  log.info(`Entering handleAdminShowBlockedPlayers`);
  const { guild } = message;
  if (!guild) return;

  const cache = store.getState();
  const blocks = cache.blocks[guild.id];
  if (!blocks) return;

  const { list } = blocks;

  if (list.length === 0)
    message.author.send(`There are no blocked users at **${guild.name}**`);
  else {
    const msg = list.reduce((acc, curr) => {
      acc += `**${
        curr.culprit.username
      }** • ${curr.expiresAt.toUTCString()} • ${
        curr.reason || 'no reason'
      } • by <@${curr.by.id}>\n`;
      return acc;
    }, ``);
    message.author.send(
      `${emojis.bannechu} List of Blocked Users at **${guild.name}** ${emojis.bannechu}\n\n${msg}`
    );
  }
  message.channel.send(`<@${message.author.id}>, you have received a DM`);
  log.info(`Exiting handleAdminShowBlockedPlayers`);
};

export const handleAdminEnableMapvoteCoinFlip: Handler = async (
  message,
  args
) => {
  log.info(`Entering handleAdminEnableMapvoteCoinFlip`);
  const { guild } = message;
  if (!guild) return;

  const cache = store.getState();
  const pugs = cache.pugs[guild.id];
  if (!pugs) return;

  const { gameTypes } = pugs;
  const gameType = args[0].toLowerCase();

  if (!gameTypes.some((g) => g.name === gameType)) {
    log.debug(`Gametype ${gameType} doesnt exist at guild ${guild.id}`);
    message.channel.send(`${gameType} does not exist`);
    return;
  }

  await setGuildGameTypeCoinFlipTo(guild.id, gameType, true);
  log.info(`Enabled mapvote coin flip for ${guild.id}`);

  store.dispatch(
    enableCoinFlip({
      guildId: guild.id,
      name: gameType,
    })
  );

  message.channel.send(`Mapvote coinflip enabled for **${gameType}**`);
  log.info(`Exiting handleAdminEnableMapvoteCoinFlip`);
};

export const handleAdminDisableMapvoteCoinFlip: Handler = async (
  message,
  args
) => {
  log.info(`Entering handleAdminDisableMapvoteCoinFlip`);
  const { guild } = message;
  if (!guild) return;

  const cache = store.getState();
  const pugs = cache.pugs[guild.id];
  if (!pugs) return;

  const { gameTypes } = pugs;
  const gameType = args[0].toLowerCase();

  if (!gameTypes.some((g) => g.name === gameType)) {
    log.debug(`Gametype ${gameType} doesnt exist at guild ${guild.id}`);
    message.channel.send(`${gameType} does not exist`);
    return;
  }

  await setGuildGameTypeCoinFlipTo(guild.id, gameType, false);
  log.info(`Disabled mapvote coin flip for ${guild.id}`);

  store.dispatch(
    disableCoinFlip({
      guildId: guild.id,
      name: gameType,
    })
  );

  message.channel.send(`Mapvote coinflip disabled for **${gameType}**`);
  log.info(`Exiting handleAdminDisableMapvoteCoinFlip`);
};

export const handleAdminUpdateTeamEmojis: Handler = async (message, args) => {
  log.info(`Entering handleAdminUpdateTeamEmojis`);
  const { guild } = message;
  if (!guild) return;

  const cache = store.getState();
  const pugs = cache.pugs[guild.id];
  if (!pugs) return;

  const { gameTypes } = pugs;

  const emoji = args[0].toLowerCase();
  if (!(emoji in teamEmojiTypes)) {
    message.channel.send(
      `Invalid emoji type! Choose one of agonies, cores or logos`
    );
    return;
  }

  const forAllGameTypes = args[1] === undefined;
  const gameTypeNames = forAllGameTypes
    ? gameTypes.map((g) => g.name)
    : [args[1].toLowerCase()];

  const teamEmojis = emoji as TeamEmojis;
  gameTypeNames.forEach(async (name) => {
    await updateGuildGameTypeTeamEmojis(guild.id, name, teamEmojis);
    store.dispatch(
      updateTeamEmojis({
        guildId: guild.id,
        name,
        teamEmojis,
      })
    );
    log.info(
      `Updated team emoji preference for gametype ${name} at guild ${guild.id}`
    );
  });

  message.channel.send(
    `Team Emojis have been changed to **${emoji}** for **${
      forAllGameTypes ? 'all gametypes' : `${args[1].toUpperCase()}`
    }**`
  );
  log.info(`Exiting handleAdminUpdateTeamEmojis`);
};

import { connectDB } from './setup';
import {
  Guilds,
  GuildStats,
  GameType,
  QueryServer,
  Users,
  Pugs,
} from '~models';
import { getNextSequences } from '~actions';
import mongoose from 'mongoose';

const source = mongoose.createConnection(
  'mongodb+srv://user:password@host/db',
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
  }
);

const schema = new mongoose.Schema({});

const discord_servers_model = source.model('discord_servers', schema);
const blocks_model = source.model('blocks', schema);
const gametypes_model = source.model('game_types', schema);
const ut99_query_servers_model = source.model('ut99_query_servers', schema);
const users_model = source.model('users', schema);
const pugs_model = source.model('pugs', schema);

async function main() {
  await connectDB();
  const discord_servers = await discord_servers_model.find({}).exec();
  const gametypes = await gametypes_model.find({}).exec();
  const ut99_query_servers = await ut99_query_servers_model.find({}).exec();
  const blocks = await blocks_model.find({}).exec();
  const users = await users_model.find({}).exec();
  const pugs = await pugs_model.find({}).sort({ _id: 1 }).exec();

  for (const ds of discord_servers) {
    const { pug_channel, query_channel, server_id } = ds.toObject();
    await Guilds.create({
      _id: server_id,
      queryChannel: query_channel,
      pugChannel: pug_channel,
      gameTypes: [],
      queryServers: [],
      blocks: [],
      ignoredCommandGroup: [],
    });

    await GuildStats.create({
      _id: server_id,
      total: 0,
      pugs: {},
    });
  }

  for (const gt of gametypes) {
    const { server_id, game_types } = gt.toObject();

    let data: GameType[] = [];
    game_types.forEach((curr: any) => {
      const {
        name,
        noOfPlayers,
        noOfTeams,
        pickingOrder,
        hasCoinFlipMapvoteDecider,
      } = curr;
      data.push({
        name,
        noOfPlayers,
        noOfTeams,
        pickingOrder,
        isCoinFlipEnabled: Boolean(hasCoinFlipMapvoteDecider),
      });
    });

    await Guilds.findByIdAndUpdate(server_id, {
      $set: {
        gameTypes: data,
      },
    }).exec();
  }

  for (const qs of ut99_query_servers) {
    const { server_id, query_servers } = qs.toObject();

    let data: QueryServer[] = [];
    query_servers.forEach((curr: any) => {
      const { timestamp, name, host, port } = curr;
      const address = `unreal://${host}:${port}`;
      data.push({
        id: timestamp,
        name,
        address,
      });
    });

    await Guilds.findByIdAndUpdate(server_id, {
      $set: {
        queryServers: data,
      },
    }).exec();
  }

  for (const _ of blocks) {
  }

  for (const user of users) {
    const { id, server_id, username, default_joins, stats } = user.toObject();
    const statsData =
      typeof stats === 'object'
        ? Object.fromEntries(
            Object.entries(stats).map(([key, value]: [any, any]) => {
              const valueData = Object.fromEntries(
                Object.entries(value).map(([k, v]) => [
                  k === 'totalRating' ? 'rating' : k,
                  v,
                ])
              );
              return [key, valueData];
            })
          )
        : {};
    Users.create({
      username,
      guildId: server_id,
      userId: id,
      defaultJoins: default_joins,
      stats: statsData,
    });
  }

  for (const p of pugs) {
    const { server_id, timestamp, pug, winner } = p.toObject();
    const {
      name,
      noOfPlayers,
      noOfTeams,
      pickingOrder,
      picking,
      players,
      captains,
      turn,
      timer,
    } = pug;

    const seq = await getNextSequences(server_id, name);
    if (!seq) {
      throw new Error(`No seq for ${server_id} ${name}`);
    }
    const { current, total } = seq;
    const capts = captains.map((c: any) => c.id);
    const playas = players.map((pl: any) => {
      const { id, username, tag, team, pick, stats } = pl;
      const statsData =
        typeof stats === 'object'
          ? Object.fromEntries(
              Object.entries(stats).map(([key, value]: [any, any]) => {
                const valueData = Object.fromEntries(
                  Object.entries(value).map(([k, v]) => [
                    k === 'totalRating' ? 'rating' : k,
                    v,
                  ])
                );
                return [key, valueData];
              })
            )
          : {};

      return {
        id,
        name: username,
        tag,
        team,
        pick,
        stats: statsData,
      };
    });

    const created = await Pugs.create({
      name,
      guildId: server_id,
      timestamp,
      gameSequence: current,
      overallSequence: total,
      game: {
        winner,
        pug: {
          name,
          noOfPlayers,
          noOfTeams,
          pickingOrder,
          turn,
          isInPickingMode: picking,
          captains: capts,
          players: playas,
          timerFn: timer,
          isCoinFlipEnabled: false,
        },
      },
    });

    await Users.bulkWrite(
      playas.map((pl: any) => {
        return {
          updateOne: {
            filter: {
              userId: pl.id,
              guildId: server_id,
            },
            update: {
              $set: {
                lastPug: created._id,
              },
            },
          },
        };
      }),
      { ordered: false }
    );
  }

  console.log('Finished');
}

main();

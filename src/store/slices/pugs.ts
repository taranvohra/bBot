import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Pug } from '~/models';
import { guildDeleted } from '../actions';

type InitPayload = WithGuildID & GuildPugsState;
type SetPugChannelPayload = WithGuildID & { channelId: string };
type AddGameTypePayload = WithGuildID & GameType;
type RemoveGameTypePayload = WithGuildID & GameTypeName;
type AddPugPayload = WithGuildID & { pug: Pug };
type RemovePugPayload = WithGuildID & GameTypeName;
type EnableCoinFlipPayload = WithGuildID & GameTypeName;
type DisableCoinFlipPayload = WithGuildID & GameTypeName;
type UpdateTeamEmojiPayload = WithGuildID &
  GameTypeName & { teamEmojis: TeamEmojis };
type UpdatePickingOrder = WithGuildID &
  GameTypeName & { pickingOrder: number[] };

type GameTypeName = { name: string };

type GameType = GameTypeName & {
  pickingOrder: Array<number>;
  noOfPlayers: number;
  noOfTeams: number;
  isCoinFlipEnabled: boolean;
  isMix: boolean;
  teamEmojis?: TeamEmojis;
};

type GuildPugsState = {
  channel: string | null;
  gameTypes: Array<GameType>;
  list: Array<Pug>;
};

type PugsState = {
  [guild: string]: GuildPugsState | undefined;
};

let initialState: PugsState = {};
const pugsSlice = createSlice({
  name: 'pugs',
  initialState,
  reducers: {
    initPugs(state, action: PayloadAction<InitPayload>) {
      const { guildId, ...data } = action.payload;
      state[guildId] = data;
    },
    setPugChannel(state, action: PayloadAction<SetPugChannelPayload>) {
      const { guildId, channelId } = action.payload;
      const thisGuild = state[guildId];
      if (thisGuild) {
        thisGuild.channel = channelId;
      }
    },
    addGameType(state, action: PayloadAction<AddGameTypePayload>) {
      const { guildId, ...gametype } = action.payload;
      const thisGuild = state[guildId];
      if (thisGuild) {
        thisGuild.gameTypes.push(gametype);
      }
    },
    removeGameType(state, action: PayloadAction<RemoveGameTypePayload>) {
      const { guildId, name } = action.payload;
      const thisGuild = state[guildId];
      if (thisGuild) {
        const { gameTypes } = thisGuild;
        const gameTypeIndex = gameTypes.findIndex((gt) => gt.name === name);
        thisGuild.gameTypes.splice(gameTypeIndex, 1);
      }
    },
    addPug(state, action: PayloadAction<AddPugPayload>) {
      const { guildId, pug } = action.payload;
      const thisGuild = state[guildId];
      if (thisGuild) {
        thisGuild.list.push(pug);
      }
    },
    removePug(state, action: PayloadAction<RemovePugPayload>) {
      const { guildId, name } = action.payload;
      const thisGuild = state[guildId];
      if (thisGuild) {
        const { list } = thisGuild;
        const pugIndex = list.findIndex((pug) => pug.name === name);
        thisGuild.list.splice(pugIndex, 1);
      }
    },
    enableCoinFlip(state, action: PayloadAction<EnableCoinFlipPayload>) {
      const { guildId, name } = action.payload;
      const thisGuild = state[guildId];
      if (thisGuild) {
        const { gameTypes, list } = thisGuild;
        const gameTypeIndex = gameTypes.findIndex((gt) => gt.name === name);
        const pugIndex = list.findIndex((pug) => pug.name === name);
        thisGuild.gameTypes[gameTypeIndex].isCoinFlipEnabled = true;
        if (pugIndex !== -1) thisGuild.list[pugIndex].isCoinFlipEnabled = true;
      }
    },
    disableCoinFlip(state, action: PayloadAction<DisableCoinFlipPayload>) {
      const { guildId, name } = action.payload;
      const thisGuild = state[guildId];
      if (thisGuild) {
        const { gameTypes, list } = thisGuild;
        const gameTypeIndex = gameTypes.findIndex((gt) => gt.name === name);
        const pugIndex = list.findIndex((pug) => pug.name === name);
        thisGuild.gameTypes[gameTypeIndex].isCoinFlipEnabled = false;
        if (pugIndex !== -1) thisGuild.list[pugIndex].isCoinFlipEnabled = false;
      }
    },
    updateTeamEmojis(state, action: PayloadAction<UpdateTeamEmojiPayload>) {
      const { guildId, name, teamEmojis } = action.payload;
      const thisGuild = state[guildId];
      if (thisGuild) {
        const { gameTypes, list } = thisGuild;
        const gameTypeIndex = gameTypes.findIndex((gt) => gt.name === name);
        const pugIndex = list.findIndex((pug) => pug.name === name);
        thisGuild.gameTypes[gameTypeIndex].teamEmojis = teamEmojis;
        if (pugIndex !== -1) thisGuild.list[pugIndex].teamEmojis = teamEmojis;
      }
    },
    updatePickingOrder(state, action: PayloadAction<UpdatePickingOrder>) {
      const { guildId, name, pickingOrder } = action.payload;
      const thisGuild = state[guildId];
      if (thisGuild) {
        const { gameTypes, list } = thisGuild;
        const gameTypeIndex = gameTypes.findIndex((gt) => gt.name === name);
        const pugIndex = list.findIndex((pug) => pug.name === name);
        thisGuild.gameTypes[gameTypeIndex].pickingOrder = pickingOrder;
        if (pugIndex !== -1)
          thisGuild.list[pugIndex].pickingOrder = pickingOrder;
      }
    },
  },
  extraReducers: (builder) => {
    builder.addCase(guildDeleted, (state, action) => {
      const { guildId } = action.payload;
      delete state[guildId];
    });
  },
});

export const {
  initPugs,
  addGameType,
  removeGameType,
  addPug,
  removePug,
  enableCoinFlip,
  disableCoinFlip,
  setPugChannel,
  updateTeamEmojis,
  updatePickingOrder,
} = pugsSlice.actions;
export const pugsReducer = pugsSlice.reducer;

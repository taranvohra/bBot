import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Pug } from '~models';

type InitPayload = WithGuildID & GuildPugsState;
type SetPugChannelPayload = WithGuildID & { channelId: string };
type AddGameTypePayload = WithGuildID & GameType;
type RemoveGameTypePayload = WithGuildID & GameTypeName;
type AddPugPayload = WithGuildID & { pug: Pug };
type RemovePugPayload = WithGuildID & GameTypeName;
type EnableCoinFlipPayload = WithGuildID & GameTypeName;
type DisableCoinFlipPayload = WithGuildID & GameTypeName;

type GameTypeName = { name: string };

type GameType = GameTypeName & {
  pickingOrder: Array<number>;
  noOfPlayers: number;
  noOfTeams: number;
  isCoinFlipEnabled: boolean;
};

type GuildPugsState = {
  channel: string | null;
  gameTypes: Array<GameType>;
  list: Array<Pug>;
};

type PugsState = {
  [guild: string]: GuildPugsState;
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
      state[guildId].channel = channelId;
    },
    addGameType(state, action: PayloadAction<AddGameTypePayload>) {
      const { guildId, ...gametype } = action.payload;
      state[guildId].gameTypes.push(gametype);
    },
    removeGameType(state, action: PayloadAction<RemoveGameTypePayload>) {
      const { guildId, name } = action.payload;
      const { gameTypes } = state[guildId];
      const gameTypeIndex = gameTypes.findIndex((gt) => gt.name === name);
      state[guildId].gameTypes.splice(gameTypeIndex, 1);
    },
    addPug(state, action: PayloadAction<AddPugPayload>) {
      const { guildId, pug } = action.payload;
      state[guildId].list.push(pug);
    },
    removePug(state, action: PayloadAction<RemovePugPayload>) {
      const { guildId, name } = action.payload;
      const { list } = state[guildId];
      const pugIndex = list.findIndex((pug) => pug.name === name);
      state[guildId].list.splice(pugIndex, 1);
    },
    enableCoinFlip(state, action: PayloadAction<EnableCoinFlipPayload>) {
      const { guildId, name } = action.payload;
      const { gameTypes } = state[guildId];
      const gameTypeIndex = gameTypes.findIndex((gt) => gt.name === name);
      state[guildId].gameTypes[gameTypeIndex].isCoinFlipEnabled = true;
    },
    disableCoinFlip(state, action: PayloadAction<DisableCoinFlipPayload>) {
      const { guildId, name } = action.payload;
      const { gameTypes } = state[guildId];
      const gameTypeIndex = gameTypes.findIndex((gt) => gt.name === name);
      state[guildId].gameTypes[gameTypeIndex].isCoinFlipEnabled = false;
    },
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
} = pugsSlice.actions;
export const pugsReducer = pugsSlice.reducer;

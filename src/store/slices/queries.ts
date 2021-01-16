import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type InitPayload = WithGuildID & GuildQueriesState;
type SetQueryChannelPayload = WithGuildID & { channelId: string };
type AddQueryServerPayload = WithGuildID & QueryServer;
type RemoveQueryServerPayload = WithGuildID & { index: number };

type QueryServer = {
  name: string;
  server: string;
  timestamp: number;
};

type GuildQueriesState = {
  channel: string | null;
  list: Array<QueryServer>;
};

type QueriesState = {
  [guild: string]: GuildQueriesState;
};

let initialState: QueriesState = {};
const queriesSlice = createSlice({
  name: 'queries',
  initialState,
  reducers: {
    initQueries(state, action: PayloadAction<InitPayload>) {
      const { guildId, ...data } = action.payload;
      state[guildId] = data;
    },
    setQueryChannel(state, action: PayloadAction<SetQueryChannelPayload>) {
      const { channelId, guildId } = action.payload;
      state[guildId].channel = channelId;
    },
    addQueryServer(state, action: PayloadAction<AddQueryServerPayload>) {
      const { guildId, ...queryServer } = action.payload;
      state[guildId].list.push(queryServer);
    },
    removeQueryServer(state, action: PayloadAction<RemoveQueryServerPayload>) {
      const { guildId, index } = action.payload;
      state[guildId].list.splice(index, 1);
    },
  },
});

export const {
  initQueries,
  setQueryChannel,
  addQueryServer,
  removeQueryServer,
} = queriesSlice.actions;
export const queriesReducer = queriesSlice.reducer;

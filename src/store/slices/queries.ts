import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type InitPayload = WithGuildID & GuildQueriesState;
type SetQueryChannelPayload = WithGuildID & { channelId: string };
type AddQueryServerPayload = WithGuildID & QueryServer;
type RemoveQueryServerPayload = WithGuildID & { index: number };
type EditQueryServerPayload = WithGuildID & {
  id: number;
  attribute: 'name' | 'address';
  value: string;
};

type QueryServer = {
  id: number;
  name: string;
  address: string;
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
    editQueryServer(state, action: PayloadAction<EditQueryServerPayload>) {
      const { guildId, attribute, value, id } = action.payload;
      const { list } = state[guildId];
      const queryServerIndex = list.findIndex((qs) => qs.id === id);
      state[guildId].list[queryServerIndex][attribute] = value;
    },
  },
});

export const {
  initQueries,
  setQueryChannel,
  addQueryServer,
  removeQueryServer,
  editQueryServer,
} = queriesSlice.actions;
export const queriesReducer = queriesSlice.reducer;

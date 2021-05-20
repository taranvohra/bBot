import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { guildDeleted } from '../actions';

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
  [guild: string]: GuildQueriesState | undefined;
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
      const thisGuild = state[guildId];
      if (thisGuild) {
        thisGuild.channel = channelId;
      }
    },
    addQueryServer(state, action: PayloadAction<AddQueryServerPayload>) {
      const { guildId, ...queryServer } = action.payload;
      const thisGuild = state[guildId];
      if (thisGuild) {
        thisGuild.list.push(queryServer);
      }
    },
    removeQueryServer(state, action: PayloadAction<RemoveQueryServerPayload>) {
      const { guildId, index } = action.payload;
      const thisGuild = state[guildId];
      if (thisGuild) {
        thisGuild.list.splice(index, 1);
      }
    },
    editQueryServer(state, action: PayloadAction<EditQueryServerPayload>) {
      const { guildId, attribute, value, id } = action.payload;
      const thisGuild = state[guildId];
      if (thisGuild) {
        const { list } = thisGuild;
        const queryServerIndex = list.findIndex((qs) => qs.id === id);
        thisGuild.list[queryServerIndex][attribute] = value;
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
  initQueries,
  setQueryChannel,
  addQueryServer,
  removeQueryServer,
  editQueryServer,
} = queriesSlice.actions;
export const queriesReducer = queriesSlice.reducer;

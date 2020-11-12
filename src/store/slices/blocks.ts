import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type InitPayload = WithGuildID & GuildBlockState;
type AddBlockedUserPayload = WithGuildID & { userId: string };
type RemoveBlockedUserPayload = WithGuildID & { userId: string };

type GuildBlockState = {
  list: Set<string>;
};

type BlocksState = {
  [guild: string]: GuildBlockState;
};

let initialState: BlocksState = {};
const blocksSlice = createSlice({
  name: 'blocks',
  initialState,
  reducers: {
    initBlocks(state, action: PayloadAction<InitPayload>) {
      const { guildId, list } = action.payload;
      state[guildId].list = list;
    },
    addBlockedUser(state, action: PayloadAction<AddBlockedUserPayload>) {
      const { guildId, userId } = action.payload;
      state[guildId].list.add(userId);
    },
    removeBlockedUser(state, action: PayloadAction<RemoveBlockedUserPayload>) {
      const { guildId, userId } = action.payload;
      state[guildId].list.delete(userId);
    },
  },
});

export const {
  initBlocks,
  addBlockedUser,
  removeBlockedUser,
} = blocksSlice.actions;
export const blocksReducer = blocksSlice.reducer;

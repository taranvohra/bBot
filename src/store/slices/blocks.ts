import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { guildDeleted } from '../actions';

type InitPayload = WithGuildID & GuildBlockState;
type AddBlockedUserPayload = WithGuildID & Block;
type RemoveBlockedUserPayload = WithGuildID & { id: string };
type AddBlockedCaptain = WithGuildID & { userId: string };
type RemoveBlockedCaptain = WithGuildID & { userId: string };

type User = {
  id: string;
  username: string;
};

type Block = {
  culprit: User;
  by: User;
  blockedOn: Date;
  expiresAt: Date;
  reason: string;
};

type GuildBlockState = {
  list: Array<Block>;
  captains: Array<string>;
};

type BlocksState = {
  [guild: string]: GuildBlockState | undefined;
};

let initialState: BlocksState = {};
const blocksSlice = createSlice({
  name: 'blocks',
  initialState,
  reducers: {
    initBlocks(state, action: PayloadAction<InitPayload>) {
      const { guildId, ...data } = action.payload;
      state[guildId] = data;
    },
    addBlockedUser(state, action: PayloadAction<AddBlockedUserPayload>) {
      const { guildId, ...block } = action.payload;
      const thisGuild = state[guildId];
      if (thisGuild) {
        thisGuild.list.push(block);
      }
    },
    removeBlockedUser(state, action: PayloadAction<RemoveBlockedUserPayload>) {
      const { guildId, id } = action.payload;
      const thisGuild = state[guildId];
      if (thisGuild) {
        const blockedUserIndex = thisGuild.list.findIndex(
          (u) => u.culprit.id === id
        );
        thisGuild.list.splice(blockedUserIndex, 1);
      }
    },
    addBlockedCaptain(state, action: PayloadAction<AddBlockedCaptain>) {
      const { guildId, userId } = action.payload;
      const thisGuild = state[guildId];
      if (thisGuild) {
        thisGuild.captains.push(userId);
      }
    },
    removeBlockedCaptain(state, action: PayloadAction<RemoveBlockedCaptain>) {
      const { guildId, userId } = action.payload;
      const thisGuild = state[guildId];
      if (thisGuild) {
        const blockedCaptIndex = thisGuild.captains.findIndex(
          (c) => c === userId
        );
        thisGuild.captains.splice(blockedCaptIndex, 1);
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
  initBlocks,
  addBlockedUser,
  removeBlockedUser,
  addBlockedCaptain,
  removeBlockedCaptain,
} = blocksSlice.actions;
export const blocksReducer = blocksSlice.reducer;

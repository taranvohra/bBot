import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type InitPayload = WithGuildID & GuildMiscState;
type SetPrefixPayload = WithGuildID & Pick<GuildMiscState, 'prefix'>;
type IgnoreCommandGroupPayload = WithGuildID & { group: string };
type UnIgnoreCommandGroupPayload = IgnoreCommandGroupPayload;
type AddCommandCooldown = WithGuildID & { command: string; timestamp: number };
type AddAutoRemoval = WithGuildID & { userId: string; expiry: Date };
type ClearAutoRemoval = WithGuildID & { userId: string };

type GuildMiscState = {
  prefix?: string;
  ignoredCommandGroup: Array<string>;
  cooldowns: {
    [command: string]: number | undefined;
  };
  autoremovals: {
    [userId: string]: Date | undefined;
  };
};

type MiscState = {
  [guild: string]: GuildMiscState | undefined;
};

let initialState: MiscState = {};
const miscSlice = createSlice({
  name: 'misc',
  initialState,
  reducers: {
    initMisc(state, action: PayloadAction<InitPayload>) {
      const { guildId, ...data } = action.payload;
      state[guildId] = data;
    },
    setPrefix(state, action: PayloadAction<SetPrefixPayload>) {
      const { guildId, prefix } = action.payload;
      const thisGuild = state[guildId];
      if (thisGuild) {
        thisGuild.prefix = prefix;
      }
    },
    ignoreCommandGroup(
      state,
      action: PayloadAction<IgnoreCommandGroupPayload>
    ) {
      const { guildId, group } = action.payload;
      const thisGuild = state[guildId];
      if (thisGuild) {
        thisGuild.ignoredCommandGroup.push(group);
      }
    },
    unIgnoreCommandGroup(
      state,
      action: PayloadAction<UnIgnoreCommandGroupPayload>
    ) {
      const { guildId, group } = action.payload;
      const thisGuild = state[guildId];
      if (thisGuild) {
        const groupIndex = thisGuild.ignoredCommandGroup.findIndex(
          (cg) => cg === group
        );
        thisGuild.ignoredCommandGroup.splice(groupIndex, 1);
      }
    },
    addCommandCooldown(state, action: PayloadAction<AddCommandCooldown>) {
      const { guildId, command, timestamp } = action.payload;
      const thisGuild = state[guildId];
      if (thisGuild) {
        thisGuild.cooldowns[command] = timestamp;
      }
    },
    addAutoRemoval(state, action: PayloadAction<AddAutoRemoval>) {
      const { guildId, userId, expiry } = action.payload;
      const thisGuild = state[guildId];
      if (thisGuild) {
        thisGuild.autoremovals[userId] = expiry;
      }
    },
    clearAutoRemoval(state, action: PayloadAction<ClearAutoRemoval>) {
      const { guildId, userId } = action.payload;
      const thisGuild = state[guildId];
      if (thisGuild) {
        delete thisGuild.autoremovals[userId];
      }
    },
  },
});

export const {
  initMisc,
  ignoreCommandGroup,
  setPrefix,
  unIgnoreCommandGroup,
  addCommandCooldown,
  addAutoRemoval,
  clearAutoRemoval,
} = miscSlice.actions;
export const miscReducer = miscSlice.reducer;

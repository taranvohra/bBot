import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type InitPayload = WithGuildID & GuildMiscState;
type SetPrefixPayload = WithGuildID & Pick<GuildMiscState, 'prefix'>;
type IgnoreCommandGroupPayload = WithGuildID & { group: string };
type UnIgnoreCommandGroupPayload = IgnoreCommandGroupPayload;
type AddCommandCooldown = WithGuildID & { command: string; timestamp: number };

type GuildMiscState = {
  prefix?: string;
  ignoredCommandGroup: Array<string>;
  cooldowns: {
    [command: string]: number;
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
  },
});

export const {
  initMisc,
  ignoreCommandGroup,
  setPrefix,
  unIgnoreCommandGroup,
  addCommandCooldown,
} = miscSlice.actions;
export const miscReducer = miscSlice.reducer;

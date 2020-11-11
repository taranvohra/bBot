import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type InitPayload = WithGuildID & GuildMiscState;
type SetPrefixPayload = WithGuildID & Pick<GuildMiscState, 'prefix'>;
type IgnoreCommandGroupPayload = WithGuildID & { command: string };
type UnIgnoreCommandGroupPayload = IgnoreCommandGroupPayload;
type AddCommandCooldown = WithGuildID & { command: string; timestamp: Date };

type GuildMiscState = {
  prefix: string | null;
  ignoredCommandGroup: Set<string>;
  cooldowns: {
    [command: string]: Date;
  };
};

type MiscState = {
  [guild: string]: GuildMiscState;
};

let initialState: MiscState = {};
const miscSlice = createSlice({
  name: 'misc',
  initialState,
  reducers: {
    initMisc(state, action: PayloadAction<InitPayload>) {
      const {
        payload: { guildId, ...data },
      } = action;
      state[guildId] = data;
    },
    setPrefix(state, action: PayloadAction<SetPrefixPayload>) {
      const {
        payload: { guildId, prefix },
      } = action;
      state[guildId].prefix = prefix;
    },
    ignoreCommandGroup(
      state,
      action: PayloadAction<IgnoreCommandGroupPayload>
    ) {
      const {
        payload: { guildId, command },
      } = action;
      state[guildId].ignoredCommandGroup.add(command);
    },
    unIgnoreCommandGroup(
      state,
      action: PayloadAction<UnIgnoreCommandGroupPayload>
    ) {
      const {
        payload: { guildId, command },
      } = action;
      state[guildId].ignoredCommandGroup.delete(command);
    },
    addCommandCooldown(state, action: PayloadAction<AddCommandCooldown>) {
      const {
        payload: { guildId, command, timestamp },
      } = action;
      state[guildId].cooldowns[command] = timestamp;
    },
  },
});

export const {
  initMisc,
  ignoreCommandGroup,
  setPrefix,
  unIgnoreCommandGroup,
} = miscSlice.actions;
export const miscReducer = miscSlice.reducer;

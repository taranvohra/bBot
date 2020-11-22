/*
    STORE: {
        pugs: { byGuildId: {} },
        queries: { byGuildId: {} },
        blocks: { byGuildId: {} },
        misc: { byGuildId: {} }
    }
 */
import { configureStore } from '@reduxjs/toolkit';
import {
  miscReducer,
  blocksReducer,
  queriesReducer,
  pugsReducer,
} from './slices';

const store = configureStore({
  reducer: {
    misc: miscReducer,
    blocks: blocksReducer,
    queries: queriesReducer,
    pugs: pugsReducer,
  },
});

export default store;
export * from './slices';

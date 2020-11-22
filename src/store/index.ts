/*
    STORE: {
        pugs: { byGuildId: {} },
        queries: { byGuildId: {} },
        blocks: { byGuildId: {} },
        misc: { byGuildId: {} }
    }
 */
import { combineReducers, configureStore } from '@reduxjs/toolkit';
import {
  miscReducer,
  blocksReducer,
  queriesReducer,
  pugsReducer,
} from './slices';

const rootReducer = combineReducers({
  miscReducer,
  blocksReducer,
  queriesReducer,
  pugsReducer,
});

const store = configureStore({
  reducer: rootReducer,
});

export default store;
export * from './slices';

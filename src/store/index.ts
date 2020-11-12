/*
    STORE: {
        pugs: { byGuildId: {} },
        queries: { byGuildId: {} },
        blocks: { byGuildId: {} },
        misc: { byGuildId: {} }
    }
 */
import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { miscReducer } from './slices';

const rootReducer = combineReducers({ miscReducer });
const store = configureStore({
  reducer: rootReducer,
});

export default store;

/*
    STORE: {
        pugs: { byGuildId: {} },
        queries: { byGuildId: {} },
        blocks: { byGuildId: {} },
        misc: { byGuildId: {} }
    }
 */
import { combineReducers, configureStore } from '@reduxjs/toolkit';
import {} from './slices';

const rootReducer = combineReducers({});
const store = configureStore({
  reducer: rootReducer,
});

export default store;

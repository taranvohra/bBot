import { createAction } from '@reduxjs/toolkit';

export const guildDeleted = createAction<{ guildId: string }>('guildDeleted');

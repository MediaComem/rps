import * as t from 'io-ts';

import { gameCodec, moveCodec } from '../common/messages';

export const gameMovePlayedCodec = t.readonly(t.interface({
  id: t.string,
  playerId: t.string,
  move: moveCodec
}));

export const gameTimeoutCodec = t.readonly(t.interface({
  id: t.string
}));

export const gameCreatedNotificationCodec = t.readonly(t.interface({
  channel: t.literal('games:created'),
  payload: gameCodec
}));

export const gameJoinedNotificationCodec = t.readonly(t.interface({
  channel: t.literal('games:joined'),
  payload: gameCodec
}));

export const gameMovePlayedNotificationCodec = t.readonly(t.interface({
  channel: t.literal('games:played'),
  payload: gameMovePlayedCodec
}));

export const gameTimeoutNotificationCodec = t.readonly(t.interface({
  channel: t.literal('games:timeout'),
  payload: gameTimeoutCodec
}));

export type GameCreatedNotification = t.TypeOf<typeof gameCreatedNotificationCodec>;
export type GameJoinedNotification = t.TypeOf<typeof gameJoinedNotificationCodec>;
export type GameMovePlayedNotification = t.TypeOf<typeof gameMovePlayedNotificationCodec>;
export type GameTimeoutNotification = t.TypeOf<typeof gameTimeoutNotificationCodec>;
export type Notification = GameCreatedNotification | GameJoinedNotification | GameMovePlayedNotification | GameTimeoutNotification;

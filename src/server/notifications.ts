import * as t from 'io-ts';

import { gameCodec } from '../common/messages';

export const gameCreatedNotificationCodec = t.readonly(t.interface({
  channel: t.literal('games:created'),
  payload: gameCodec
}));

export type GameCreatedNotification = t.TypeOf<typeof gameCreatedNotificationCodec>;
export type Notification = GameCreatedNotification;

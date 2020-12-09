import * as t from 'io-ts';

export const playerCodec = t.readonly(t.interface({
  id: t.string,
  name: t.string
}));

export const gameCodec = t.readonly(t.interface({
  id: t.readonly(t.string),
  players: t.readonly(t.tuple([
    playerCodec,
    t.union([ playerCodec, t.null ])
  ]))
}));

export const availableGamesMessageCodec = t.readonly(t.interface({
  topic: t.literal('games'),
  event: t.literal('available'),
  payload: t.readonlyArray(gameCodec)
}));

export const gameCreatedMessageCodec = t.readonly(t.interface({
  topic: t.literal('games'),
  event: t.literal('created'),
  payload: t.readonly(t.interface({
    id: t.string
  }))
}));

export const createGameMessageCodec = t.readonly(t.interface({
  topic: t.literal('games'),
  event: t.literal('create'),
  payload: t.readonly(t.interface({
    playerName: t.string
  }))
}));

export const playerRegisteredMessageCodec = t.readonly(t.interface({
  topic: t.literal('players'),
  event: t.literal('registered'),
  payload: t.readonly(t.interface({
    id: t.string
  }))
}));

export const messageCodec = t.union([
  availableGamesMessageCodec,
  createGameMessageCodec,
  gameCreatedMessageCodec,
  playerRegisteredMessageCodec
]);

export type CreateGameMessage = t.TypeOf<typeof createGameMessageCodec>;
export type Game = t.TypeOf<typeof gameCodec>;
export type GameMessage = t.TypeOf<typeof availableGamesMessageCodec> | CreateGameMessage | t.TypeOf<typeof gameCreatedMessageCodec>;
export type Player = t.TypeOf<typeof playerCodec>;
export type PlayerMessage = t.TypeOf<typeof playerRegisteredMessageCodec>;
export type Message = GameMessage | PlayerMessage;

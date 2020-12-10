import * as t from 'io-ts';

export const moveCodec = t.union([
  t.literal('rock'),
  t.literal('paper'),
  t.literal('scissors')
]);

export const playerCodec = t.readonly(t.interface({
  id: t.string,
  name: t.string
}));

export const playerWithMoveCodec = t.readonly(t.interface({
  id: t.string,
  name: t.string,
  move: moveCodec
}));

// FIXME: two different types for games that are still waiting for players and ongoing games
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

export const createGameMessageCodec = t.readonly(t.interface({
  topic: t.literal('games'),
  event: t.literal('create'),
  payload: t.readonly(t.interface({
    playerName: t.string
  }))
}));

export const joinGameMessageCodec = t.readonly(t.interface({
  topic: t.literal('games'),
  event: t.literal('join'),
  payload: t.readonly(t.interface({
    id: t.string,
    playerName: t.string
  }))
}));

export const gameCountdownMessageCodec = t.readonly(t.interface({
  topic: t.literal('games'),
  event: t.literal('countdown'),
  payload: t.readonly(t.interface({
    value: t.number
  }))
}));

export const gameCreatedMessageCodec = t.readonly(t.interface({
  topic: t.literal('games'),
  event: t.literal('created'),
  payload: t.readonly(t.interface({
    id: t.string
  }))
}));

export const gameDoneMessageCodec = t.readonly(t.interface({
  topic: t.literal('games'),
  event: t.literal('done'),
  payload: t.readonly(t.interface({
    id: t.string,
    moves: t.tuple([ t.union([ moveCodec, t.null ]), t.union([ moveCodec, t.null ]) ]),
    players: t.tuple([ playerCodec, playerCodec ])
  }))
}));

export const gameJoinedMessageCodec = t.readonly(t.interface({
  topic: t.literal('games'),
  event: t.literal('joined'),
  payload: t.readonly(t.interface({
    id: t.string,
    playerId: t.string,
    playerName: t.string
  }))
}));

export const gameMovePlayedMessageCodec = t.readonly(t.interface({
  topic: t.literal('games'),
  event: t.literal('played'),
  payload: t.readonly(t.interface({
    id: t.string,
    playerId: t.string,
    move: moveCodec
  }))
}));

export const playInGameMessageCodec = t.readonly(t.interface({
  topic: t.literal('games'),
  event: t.literal('play'),
  payload: t.readonly(t.interface({
    id: t.string,
    move: moveCodec
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
  gameCountdownMessageCodec,
  gameDoneMessageCodec,
  gameJoinedMessageCodec,
  gameMovePlayedMessageCodec,
  joinGameMessageCodec,
  playInGameMessageCodec,
  playerRegisteredMessageCodec
]);

export type CreateGameMessage = t.TypeOf<typeof createGameMessageCodec>;
export type Game = t.TypeOf<typeof gameCodec>;
export type GameDoneMessage = t.TypeOf<typeof gameDoneMessageCodec>;
export type GameMovePlayedMessage = t.TypeOf<typeof gameMovePlayedMessageCodec>;
export type JoinGameMessage = t.TypeOf<typeof joinGameMessageCodec>;
export type PlayInGameMessage = t.TypeOf<typeof playInGameMessageCodec>;

export type GameMessage =
  t.TypeOf<typeof availableGamesMessageCodec> |
  CreateGameMessage |
  t.TypeOf<typeof gameCountdownMessageCodec> |
  t.TypeOf<typeof gameCreatedMessageCodec> |
  GameDoneMessage |
  t.TypeOf<typeof gameJoinedMessageCodec> |
  GameMovePlayedMessage |
  JoinGameMessage |
  PlayInGameMessage
;

export type Move = t.TypeOf<typeof moveCodec>;

export type Player = t.TypeOf<typeof playerCodec>;
export type PlayerMessage = t.TypeOf<typeof playerRegisteredMessageCodec>;

export type Message = GameMessage | PlayerMessage;

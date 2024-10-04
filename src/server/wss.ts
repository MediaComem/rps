import { Server as HttpServer } from 'http';
import * as t from 'io-ts';
import { Knex } from 'knex';
import { v4 as uuid } from 'uuid';
import * as WebSocket from 'ws';

import { CreateGameMessage, Game, gameCodec, GameDoneMessage, GameMessage, JoinGameMessage, Message, messageCodec, Move, Player, PlayInGameMessage } from '../common/messages.js';
import { decode, decodeString, encodeMessage } from '../common/utils.js';
import { Database } from './db.js';
import { gameMovePlayedCodec, gameTimeoutCodec, Notification } from './notifications.js';

const clients: Record<string, WebSocket | undefined> = {};

export function createWebSocketServer(db: Database, httpServer: HttpServer) {

  subscribeToNotification(db, 'games:created', gameCodec, handleGameCreatedNotification);
  subscribeToNotification(db, 'games:joined', gameCodec, handleGameJoinedNotification);
  subscribeToNotification(db, 'games:played', gameMovePlayedCodec, handleGamePlayedNotification);
  subscribeToNotification(db, 'games:timeout', gameTimeoutCodec, handleGameTimeoutNotification);

  const webSocketServer = new WebSocket.WebSocketServer({ server: httpServer });
  webSocketServer.on('connection', client => registerClient(db, client));
}

async function createGame(db: Database, clientId: string, message: CreateGameMessage) {
  const { playerName } = message.payload;

  const firstPlayer: Player = { id: clientId, name: playerName };

  await db.knex.transaction(async trx => {
    const [ data ] = await trx('games').insert({
      first_player_id: clientId,
      first_player_name: playerName
    }).returning('id')

    const newGame: Game = {
      id: data.id,
      players: [ firstPlayer, null ]
    };

    await notify(trx, {
      channel: 'games:created',
      payload: newGame
    });
  });
}

function findUnusedUuid() {
  while (true) {
    const id = uuid();
    if (!clients[id]) {
      return id;
    }
  }
}

async function handleMessage(db: Database, clientId: string, message: Message) {
  switch (message.topic) {
    case 'games':
      await handleGameMessage(db, clientId, message);
      break;
    default:
      console.log('Received unexpected message', encodeMessage(message));
  }
}

async function handleGameMessage(db: Database, clientId: string, message: GameMessage) {
  switch (message.event) {
    case 'create':
      await createGame(db, clientId, message)
      break;
    case 'join':
      await joinGame(db, clientId, message);
      break;
    case 'play':
      await playInGame(db, clientId, message);
      break;
    default:
      console.log('Received unexpected game message', encodeMessage(message));
  }
}

async function joinGame(db: Database, clientId: string, message: JoinGameMessage) {

  const [ game ] = await db.knex.transaction(async trx => {
    const updated = await trx('games')
      .update({
        second_player_id: clientId,
        second_player_name: message.payload.playerName,
        state: 'ongoing'
      })
      .where('id', message.payload.id)
      .whereNot('first_player_id', clientId)
      .whereNull('second_player_id')

    if (updated <= 0) {
      return [];
    }

    return trx('games').select().where('id', message.payload.id);
  });

  if (game) {
    await notify(db.knex, {
      channel: 'games:joined',
      payload: {
        id: game.id,
        players: [
          { id: game.first_player_id, name: game.first_player_name },
          { id: game.second_player_id, name: game.second_player_name }
        ]
      }
    });
  }
}

async function playInGame(db: Database, clientId: string, message: PlayInGameMessage) {

  const [ firstPlayerMoveUpdate, secondPlayerMoveUpdate ] = await Promise.all([
    db.knex('games')
      .update({ first_player_move: message.payload.move, state: db.knex.raw("(CASE WHEN second_player_move IS NOT NULL THEN 'done' ELSE state END)") })
      .where({ id: message.payload.id, state: 'ongoing', first_player_id: clientId })
      .whereNull('first_player_move'),
    db.knex('games')
      .update({ second_player_move: message.payload.move, state: db.knex.raw("(CASE WHEN first_player_move IS NOT NULL THEN 'done' ELSE state END)") })
      .where({ id: message.payload.id, state: 'ongoing', second_player_id: clientId })
      .whereNull('second_player_move')
  ]);

  if (firstPlayerMoveUpdate <= 0 && secondPlayerMoveUpdate <= 0) {
    return;
  }

  await notify(db.knex, {
    channel: 'games:played',
    payload: {
      id: message.payload.id,
      move: message.payload.move,
      playerId: clientId
    }
  });
}

function subscribeToNotification<
  Channel extends string,
  Codec extends t.ReadonlyC<t.TypeC<any>>
>(
  db: Database,
  channel: Channel,
  codec: Codec,
  handler: (database: Database, value: t.TypeOf<Codec>) => Promise<void>
) {
  db.subscriber.notifications.on(channel, payload => {
    const decoded = decode(codec, payload);
    if (decoded) {
      Promise
        .resolve()
        .then(() => handler(db, decoded))
        .catch(err => console.error(err.stack));
    } else {
      console.warn('Invalid database notification on channel', channel, payload);
    }
  });
}

async function handleGameCreatedNotification(_db: Database, game: Game) {
  const clientId = game.players[0].id;
  const gameId = game.id;

  sendMessage(clientId, {
    topic: 'games',
    event: 'created',
    payload: {
      id: gameId
    }
  });

  broadcastMessageToOthers(clientId, {
    topic: 'games',
    event: 'available',
    payload: [ game ]
  });
}

async function handleGameJoinedNotification(db: Database, game: Game) {

  const { id, players: [ firstPlayer, secondPlayer ] } = game;
  if (!secondPlayer) {
    return;
  }

  broadcastMessage({
    topic: 'games',
    event: 'joined',
    payload: {
      id,
      playerId: secondPlayer.id,
      playerName: secondPlayer.name
    }
  });

  if (clients[firstPlayer.id]) {
    startGameCountdownForPlayer(db, game, firstPlayer);
  }

  if (secondPlayer && clients[secondPlayer.id]) {
    startGameCountdownForPlayer(db, game, secondPlayer);
  }
}

async function handleGamePlayedNotification(db: Database, { id, move, playerId }: { id: string, move: Move, playerId: string }) {

  const [ game ] = await db.knex('games').select().where('id', id);
  if (!game) {
    return;
  }

  if (game.state !== 'done') {
    const adversary = playerId === game.first_player_id ? game.second_player_id : game.first_player_id;
    sendMessage(adversary, {
      topic: 'games',
      event: 'played',
      payload: {
        id,
        move,
        playerId
      }
    });
  } else {
    sendGameDoneMessage(game, false);
  }
}

async function handleGameTimeoutNotification(db: Database, { id }: { id: string }) {

  const [ game ] = await db.knex('games').select().where('id', id);
  if (!game) {
    return;
  }

  sendGameDoneMessage(game, true);
}

function registerClient(db: Database, client: WebSocket) {

  const clientId = findUnusedUuid();
  clients[clientId] = client;
  console.log(`Client ${clientId} connected`);

  client.on('message', message => {
    const decoded = decodeString(messageCodec, message.toString());
    if (decoded) {
      Promise
        .resolve()
        .then(() => handleMessage(db, clientId, decoded))
        .catch(err => console.error(err.stack));
    } else {
      console.warn('Received unexpected web socket message', message);
    }
  });

  client.on('close', () => {
    Promise
      .resolve()
      .then(() => timeOutPlayerGames(db, clientId))
      .catch(err => console.error(err.stack));
  });

  sendMessage(clientId, {
    topic: 'players',
    event: 'registered',
    payload: {
      id: clientId
    }
  });

  Promise
    .resolve()
    .then(() => sendAvailableGames(db, clientId))
    .catch(err => console.error(err.stack));
}

async function sendAvailableGames(db: Database, clientId: string) {

  const games = await db.knex('games')
    .select()
    .where({ state: 'waiting_for_player' })
    .whereNot('first_player_id', clientId);

  sendMessage(clientId, {
    topic: 'games',
    event: 'available',
    payload: games.map(serializeGame)
  });
}

function serializeGame(game: any): Game {
  return {
    id: game.id,
    players: [
      { id: game.first_player_id, name: game.first_player_name },
      game.second_player_id ? { id: game.second_player_id, name: game.second_player_name } : null
    ]
  };
}

function broadcastMessage(message: Message) {
  Object.values(clients).forEach(client => client?.send(encodeMessage(message)));
}

function broadcastMessageToOthers(clientId: string, message: Message) {
  Object.entries(clients).forEach(([ currentClientId, client ]) => {
    if (currentClientId === clientId || !client) {
      return;
    }

    client.send(encodeMessage(message));
  });
}

async function notify(knex: Knex<any, any>, notification: Notification) {
  await knex.raw(
    "SELECT pg_notify(?, ?);",
    [ notification.channel, JSON.stringify(notification.payload) ]
  );
}

function sendMessage(clientId: string, message: Message) {
  const client = clients[clientId];
  if (client) {
    client.send(encodeMessage(message));
  }
}

function startGameCountdownForPlayer(db: Database, game: Game, player: Player) {
  // TODO: cancel timeouts if game is done
  setTimeout(() => sendCountdownMessage(player, 3), 3000)
  setTimeout(() => sendCountdownMessage(player, 2), 4000)
  setTimeout(() => sendCountdownMessage(player, 1), 5000)
  setTimeout(() => timeOutGame(db, game.id), 6000);
}

function sendCountdownMessage(player: Player, value: number) {
  sendMessage(player.id, {
    topic: 'games',
    event: 'countdown',
    payload: { value }
  });
}

async function timeOutGame(db: Database, gameId: string) {

  const updateCount = await db.knex('games')
    .update({ state: 'done' })
    .where({ id: gameId })
    .whereNot('state', 'done');

  if (updateCount <= 0) {
    return;
  }

  await notify(db.knex, {
    channel: 'games:timeout',
    payload: { id: gameId }
  });
}

async function timeOutPlayerGames(db: Database, playerId: string) {

  const games = await db.knex('games')
    .select()
    .whereRaw('first_player_id = ? OR second_player_id = ?', [ playerId, playerId ])
    .whereNot('state', 'done');

  for (const game of games) {
    await timeOutGame(db, game.id);
  }
}

function sendGameDoneMessage(game: any, toEveryone: boolean) {

  const msg: GameDoneMessage = {
    topic: 'games',
    event: 'done',
    payload: {
      id: game.id,
      moves: [
        game.first_player_move ?? null,
        game.second_player_move ?? null
      ],
      players: [
        { id: game.first_player_id, name: game.first_player_name },
        game.second_player_id ? { id: game.second_player_id, name: game.second_player_name } : null
      ]
    }
  };

  if (toEveryone) {
    broadcastMessage(msg);
  } else {
    sendMessage(game.first_player_id, msg);
    sendMessage(game.second_player_id, msg);
  }
}

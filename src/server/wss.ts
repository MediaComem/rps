import { Server as HttpServer } from 'http';
import { v4 as uuid } from 'uuid';
import * as WebSocket from 'ws';
import { Server as WebSocketServer } from 'ws';

import { CreateGameMessage, Game, gameCodec, GameMessage, Message, messageCodec, Player } from '../common/messages';
import { decode, decodeString, encodeMessage } from '../common/utils';
import { Database } from './db';

const clients: Record<string, WebSocket | undefined> = {};
const games: Game[] = [];

export function createWebSocketServer(db: Database, httpServer: HttpServer) {

  db.subscriber.notifications.on('games:created', payload => {
    const decoded = decode(gameCodec, payload);
    if (decoded) {
      Promise
        .resolve()
        .then(() => handleGameCreated(decoded))
        .catch(err => console.error(err.stack));
    }
  });

  const webSocketServer = new WebSocketServer({ server: httpServer });
  webSocketServer.on('connection', client => registerClient(db, client));
}

async function createGame(db: Database, clientId: string, message: CreateGameMessage) {
  const { playerName } = message.payload;

  const firstPlayer: Player = { id: clientId, name: playerName };

  let gameId = '';
  await db.knex.transaction(async () => {
    [ gameId ] = await db.knex('games').insert({
      first_player_id: clientId,
      first_player_name: playerName
    }).returning('id')

    const newGame: Game = {
      id: gameId,
      players: [ firstPlayer, null ]
    };

    await db.knex.raw(
      "SELECT pg_notify('games:created', ?);",
      [ JSON.stringify(newGame) ]
    );
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

async function handleGameCreated(game: Game) {
  const clientId = game.players[0].id;
  const gameId = game.id;

  games.push(game);

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
    default:
      console.log('Received unexpected game message', encodeMessage(message));
  }
}

function registerClient(db: Database, client: WebSocket) {

  const clientId = findUnusedUuid();
  clients[clientId] = client;
  console.log(`Client ${clientId} connected`);

  client.on('message', message => {
    const decoded = decodeString(messageCodec, message);
    if (decoded) {
      Promise
        .resolve()
        .then(() => handleMessage(db, clientId, decoded))
        .catch(err => console.error(err.stack));
    }
  });

  client.send(encodeMessage({
    topic: 'players',
    event: 'registered',
    payload: {
      id: clientId
    }
  }))

  client.send(encodeMessage({
    topic: 'games',
    event: 'available',
    payload: []
  }));
}

function broadcastMessageToOthers(clientId: string, message: Message) {
  Object.entries(clients).forEach(([ currentClientId, client ]) => {
    if (currentClientId === clientId || !client) {
      return;
    }

    client.send(encodeMessage(message));
  });
}

function sendMessage(clientId: string, message: Message) {
  const client = clients[clientId];
  if (client) {
    client.send(encodeMessage(message));
  }
}

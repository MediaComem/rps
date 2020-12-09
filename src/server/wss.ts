import { Server as HttpServer } from 'http';
import { v4 as uuid } from 'uuid';
import * as WebSocket from 'ws';
import { Server as WebSocketServer } from 'ws';

import { Game, GameMessage, Message, messageCodec, Player } from '../common/messages';
import { decode, encodeMessage } from '../common/utils';

const clients: Record<string, WebSocket | undefined> = {};
const games: Game[] = [];

export function create(httpServer: HttpServer) {
  const webSocketServer = new WebSocketServer({ server: httpServer });
  webSocketServer.on('connection', registerClient);
}

function handleMessage(clientId: string, message: Message) {
  switch (message.topic) {
    case 'games':
      handleGameMessage(clientId, message);
      break;
  }
}

function handleGameMessage(clientId: string, message: GameMessage) {
  switch (message.event) {

    case 'available':
      break;

    case 'create':

      const { playerName } = message.payload;

      const firstPlayer: Player = { id: clientId, name: playerName };
      const gameId = uuid();
      const newGame: Game = {
        id: gameId,
        players: [ firstPlayer, null ]
      };

      games.push(newGame);

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
        payload: [ newGame ]
      });

      break;

  }
}

function findUnusedUuid() {
  while (true) {
    const id = uuid();
    if (!clients[id]) {
      return id;
    }
  }
}

function registerClient(client: WebSocket) {

  const clientId = findUnusedUuid();
  clients[clientId] = client;
  console.log(`Client ${clientId} connected`);

  client.on('message', message => {
    const decoded = decode(messageCodec, message);
    if (decoded) {
      handleMessage(clientId, decoded);
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

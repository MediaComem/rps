import { derived, writable } from 'svelte/store';

import { Message, messageCodec } from '../common/messages';
import { decodeString, encodeMessage } from '../common/utils';

export enum WebSocketConnectionState {
  Connecting,
  Connected,
  Disconnected
}

export interface WebSocketStore {
  readonly connection: WebSocketConnectionState;
  readonly messages: Readonly<Message[]>;
}

const initialWebSocketStore: WebSocketStore = {
  connection: WebSocketConnectionState.Connecting,
  messages: []
};

const maxMessagesInMemory = 100;

const webSocketUrl = new URL(window.location.href);
webSocketUrl.protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';

export const webSocketStore = createWebSocketStore();

export const latestMessageStore = derived(webSocketStore, store => store.messages[0]);

function createWebSocketStore() {

  const { subscribe, update } = writable<WebSocketStore>(initialWebSocketStore);

  const ws = new WebSocket(webSocketUrl.toString());

  ws.addEventListener('close', () => {
    console.log('@@@ connection closed');
    update(store => ({ ...store, connection: WebSocketConnectionState.Disconnected }));
  });

  ws.addEventListener('message', message => {
    const decoded = decodeString(messageCodec, message.data);
    if (decoded) {
      console.log('@@@ message received', decoded);
      update(store => ({ ...store, messages: [ decoded, ...store.messages.slice(0, maxMessagesInMemory - 1) ]}));
    } else {
      console.log('@@@ invalid message received', message.data);
    }
  });

  ws.addEventListener('open', () => {
    console.log('@@@ connection opened');
    update(store => ({ ...store, connection: WebSocketConnectionState.Connected }));
  });

  function sendMessage(message: Message) {
    ws.send(encodeMessage(message));
  }

  return {
    sendMessage,
    subscribe
  };
}

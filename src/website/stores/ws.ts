import type * as t from 'io-ts';
import { onDestroy } from 'svelte';
import { derived, readable, Readable } from 'svelte/store';

import { Message, messageCodec } from '../../common/messages';
import { decodeString, encodeMessage } from '../../common/utils';
import { filtered } from '../utils';

export enum WebSocketConnectionState {
  Connecting,
  Connected,
  Disconnected
}

export interface WebSocketState {
  readonly connection: WebSocketConnectionState;
  readonly messages: Readonly<Message[]>;
}

export interface WebSocketStore extends Readable<WebSocketState> {
  readonly connected: Readable<boolean>;
  readonly latestMessage: Readable<Message>;

  sendMessage(message: Message): void;
}

const maxMessagesInMemory = 100;

const webSocketUrl = new URL(window.location.href);
webSocketUrl.protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';

export const webSocketStore = createWebSocketStore();

export function onDisconnected(callback: () => void) {
  onDestroy(webSocketStore.connected.subscribe(connected => {
    if (!connected) {
      callback();
    }
  }));
}

export function onMessage<Codec extends t.ReadonlyC<t.TypeC<any>>>(codec: Codec, callback: (msg: t.TypeOf<Codec>) => void) {
  let skip = true;
  onDestroy(filtered(webSocketStore.latestMessage, codec.is).subscribe(msg => {
    if (!msg || skip) {
      skip = false;
      return;
    }

    skip = false;
    callback(msg);
  }));
}

function createWebSocketStore(): WebSocketStore {

  let messages: Readonly<Message[]> = [];
  const ws = new WebSocket(webSocketUrl.toString());

  const { subscribe } = readable<WebSocketState>({
    messages,
    connection: WebSocketConnectionState.Connecting
  }, set => {
    ws.addEventListener('close', () => {
      console.log('@@@ connection closed');
      set({
        messages,
        connection: WebSocketConnectionState.Disconnected
      });
    });

    ws.addEventListener('message', message => {
      const decoded = decodeString(messageCodec, message.data);
      if (decoded) {
        messages = [ decoded, ...messages.slice(0, maxMessagesInMemory - 1) ];
        set({
          messages,
          connection: WebSocketConnectionState.Connected
        });
      } else {
        console.log('@@@ invalid message received', message.data);
      }
    });

    ws.addEventListener('open', () => {
      console.log('@@@ connection opened');
      set({
        messages,
        connection: WebSocketConnectionState.Connected
      });
    });
  });

  function sendMessage(message: Message) {
    ws.send(encodeMessage(message));
  }

  const baseStore = { subscribe };

  return {
    sendMessage,
    subscribe,
    connected: derived(baseStore, store => store.connection === WebSocketConnectionState.Connected),
    latestMessage: derived(baseStore, store => store.messages[0])
  };
}

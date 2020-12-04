import * as t from 'io-ts';

export interface Message {
  readonly topic: string;
  readonly event: string;
  readonly payload: unknown;
}

export const messageCodec = t.interface({
  topic: t.readonly(t.string),
  event: t.readonly(t.string),
  payload: t.unknown
});

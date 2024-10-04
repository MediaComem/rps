import { isRight } from 'fp-ts/lib/Either.js';
import type * as t from 'io-ts';

import type { Message } from './messages.js';

export function decode<Codec extends t.ReadonlyC<t.TypeC<any>> | t.TypeC<any> | t.UnionC<any>>(
  codec: Codec,
  data: unknown
): t.TypeOf<Codec> | undefined {
  const either = codec.decode(data);
  return isRight(either) ? either.right : undefined;
}

export function decodeString<Codec extends t.ReadonlyC<t.TypeC<any>> | t.TypeC<any> | t.UnionC<any>>(
  codec: Codec,
  data: unknown
): t.TypeOf<Codec> | undefined {
  if (typeof data !== 'string') {
    return;
  }

  const parsed = parseJson(data);
  if (parsed === undefined) {
    return;
  }

  return decode(codec, parsed);
}

export function encodeMessage(message: Message) {
  return JSON.stringify(message);
}

function parseJson(value: string) {
  try {
    return JSON.parse(value);
  } catch {
    return;
  }
}

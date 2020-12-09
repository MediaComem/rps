import { isRight } from 'fp-ts/lib/Either';
import type * as t from 'io-ts';

import type { Message } from './messages';

export function decode<Codec extends t.TypeC<any> | t.UnionC<any>>(
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

  const either = codec.decode(parsed);
  return isRight(either) ? either.right : undefined;
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

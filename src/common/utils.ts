import { isRight } from 'fp-ts/lib/Either';
import type * as t from 'io-ts';

import type { Message } from './messages';

export function decode<Codec extends t.TypeC<any> | t.UnionC<any>>(
  codec: Codec,
  data: unknown
): t.TypeOf<Codec> | undefined {
  const either = codec.decode(data);
  return isRight(either) ? either.right : undefined;
}

export function encodeMessage(message: Message) {
  return JSON.stringify(message);
}

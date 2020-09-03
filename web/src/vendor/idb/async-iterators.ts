/**
 * ISC License (ISC)
 * Copyright (c) 2016, Jake Archibald <jaffathecake@gmail.com>
 * 
 * Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted,
 * provided that the above copyright notice and this permission notice appear in all copies.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS.
 * IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS,
 * WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
 * 
 */
import { instanceOfAny, Func } from './util';
import { replaceTraps, reverseTransformCache, unwrap } from './wrap-idb-value';
import { IDBPObjectStore, IDBPIndex, IDBPCursor } from './entry';

const advanceMethodProps = ['continue', 'continuePrimaryKey', 'advance'];
const methodMap: { [s: string]: Func } = {};
const advanceResults = new WeakMap<IDBPCursor, Promise<IDBPCursor | null>>();
const ittrProxiedCursorToOriginalProxy = new WeakMap<IDBPCursor, IDBPCursor>();

const cursorIteratorTraps: ProxyHandler<any> = {
  get(target, prop) {
    if (!advanceMethodProps.includes(prop as string)) return target[prop];

    let cachedFunc = methodMap[prop as string];

    if (!cachedFunc) {
      cachedFunc = methodMap[prop as string] = function (
        this: IDBPCursor,
        ...args: any
      ) {
        advanceResults.set(
          this,
          (ittrProxiedCursorToOriginalProxy.get(this) as any)[prop](...args),
        );
      };
    }

    return cachedFunc;
  },
};

async function* iterate(
  this: IDBPObjectStore | IDBPIndex | IDBPCursor,
  ...args: any[]
): AsyncIterableIterator<any> {
  // tslint:disable-next-line:no-this-assignment
  let cursor: typeof this | null = this;

  if (!(cursor instanceof IDBCursor)) {
    cursor = await (cursor as IDBPObjectStore | IDBPIndex).openCursor(...args);
  }

  if (!cursor) return;

  cursor = cursor as IDBPCursor;
  const proxiedCursor = new Proxy(cursor, cursorIteratorTraps);
  ittrProxiedCursorToOriginalProxy.set(proxiedCursor, cursor);
  // Map this double-proxy back to the original, so other cursor methods work.
  reverseTransformCache.set(proxiedCursor, unwrap(cursor));

  while (cursor) {
    yield proxiedCursor;
    // If one of the advancing methods was not called, call continue().
    cursor = await (advanceResults.get(proxiedCursor) || cursor.continue());
    advanceResults.delete(proxiedCursor);
  }
}

function isIteratorProp(target: any, prop: number | string | symbol) {
  return (
    (prop === Symbol.asyncIterator &&
      instanceOfAny(target, [IDBIndex, IDBObjectStore, IDBCursor])) ||
    (prop === 'iterate' && instanceOfAny(target, [IDBIndex, IDBObjectStore]))
  );
}

replaceTraps((oldTraps) => ({
  ...oldTraps,
  get(target, prop, receiver) {
    if (isIteratorProp(target, prop)) return iterate;
    return oldTraps.get!(target, prop, receiver);
  },
  has(target, prop) {
    return isIteratorProp(target, prop) || oldTraps.has!(target, prop);
  }
}));

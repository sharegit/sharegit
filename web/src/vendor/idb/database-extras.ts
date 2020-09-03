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
import { Func } from './util';
import { replaceTraps } from './wrap-idb-value';
import { IDBPDatabase, IDBPObjectStore, IDBPIndex } from './entry';

const readMethods = ['get', 'getKey', 'getAll', 'getAllKeys', 'count'];
const writeMethods = ['put', 'add', 'delete', 'clear'];
const cachedMethods = new Map<string, Func>();

function getMethod(
  target: any,
  prop: string | number | symbol,
): Func | undefined {
  if (
    !(
      target instanceof IDBDatabase &&
      !(prop in target) &&
      typeof prop === 'string'
    )
  ) {
    return;
  }

  if (cachedMethods.get(prop)) return cachedMethods.get(prop);

  const targetFuncName: string = prop.replace(/FromIndex$/, '');
  const useIndex = prop !== targetFuncName;
  const isWrite = writeMethods.includes(targetFuncName);

  if (
    // Bail if the target doesn't exist on the target. Eg, getAll isn't in Edge.
    !(targetFuncName in (useIndex ? IDBIndex : IDBObjectStore).prototype) ||
    !(isWrite || readMethods.includes(targetFuncName))
  ) {
    return;
  }

  const method = async function (
    this: IDBPDatabase,
    storeName: string,
    ...args: any[]
  ) {
    // isWrite ? 'readwrite' : undefined gzipps better, but fails in Edge :(
    const tx = this.transaction(storeName, isWrite ? 'readwrite' : 'readonly');
    let target: IDBPObjectStore | IDBPIndex = tx.store;
    if (useIndex) target = target.index(args.shift());
    const returnVal = await (target as any)[targetFuncName](...args);
    if (isWrite) await tx.done;
    return returnVal;
  };

  cachedMethods.set(prop, method);
  return method;
}

// Changed this from spread (...) operator to Object.assign to wirth with Edge
replaceTraps((oldTraps: ProxyHandler<any>) => {
  let newTraps: ProxyHandler<any> = { };
  Object.assign(newTraps, oldTraps);
  newTraps.get = (target, prop, receiver) => getMethod(target, prop) || oldTraps.get!(target, prop, receiver)
  newTraps.has = (target, prop) => !!getMethod(target, prop) || oldTraps.has!(target, prop)
  return newTraps;
});

import Dictionary from "../util/Dictionary";
import { IDBPDatabase, openDB } from 'idb';

const DB_CACHE_OBJECT_STORE : string = 'share-git-cache';

export interface CacheElement<T> {
    exp: number;
    data: T;
}

export default class RCache {
    private cache?: IDBPDatabase;
    private dbName: string;

    constructor(dbName: string) {
        this.dbName = dbName;
    }

    async init() {
        this.cache = await openDB(this.dbName, 1, {
            upgrade(db, oldVersion, newVersion, transaction) {
              switch (oldVersion) {
                  case 0:
                      console.log(`Creating ${DB_CACHE_OBJECT_STORE} for the first time`);
                      db.createObjectStore(DB_CACHE_OBJECT_STORE);
                      break;
                default:
                    break;
              }
            },
            blocked() {
              // …
            },
            blocking() {
              // …
            },
            terminated() {
              // …
            },
          });

    }

    async getOrPutAndGet<T>(key: string, value: () => Promise<T>, ttl: number): Promise<T> {
        const g = await this.get<T>(key)
        if (g == undefined) {
            const v : T = await value()
            await this.put<T>(key, v, ttl);
            return v;
        } else {
            return g;
        }
    }

    async get<T>(key: string): Promise<T | undefined> {
        console.log(this.cache);
        if (this.cache == undefined)
            return undefined;

        const c = await this.cache.get(DB_CACHE_OBJECT_STORE, key) as CacheElement<T>;
        console.log(c);
        
        if (c == undefined || c.exp < new Date().getTime() / 1000)
            return undefined;
        else
            return c.data;
    }

    // TTL in seconds!! 
    async put<T>(key: string, value: T, ttl: number = 3600) : Promise<any> {
        if (this.cache == undefined)
            return undefined;

        const c = {
            exp: new Date().getTime() / 1000 + ttl,
            data: value
        };
        await this.cache.put(DB_CACHE_OBJECT_STORE, c, key);
    }
}
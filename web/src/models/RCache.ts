import Dictionary from "../util/Dictionary";
import { IDBPDatabase, openDB } from '../vendor/idb/index';

const DB_CACHE_OBJECT_STORE : string = 'share-git-cache';

export interface CacheElement<T> {
    exp: number;
    data: T;
}

export default class RCache {
    private dictionary?: Dictionary<any>;
    private cache?: IDBPDatabase;
    private dbName: string;

    constructor(dbName: string) {
        this.dbName = dbName;
    }

    async init() {
        try {
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
                },
                blocking() {
                },
                terminated() {
                }
            });
            this.dictionary = undefined;
            console.log('Using IndexedDB cache!')
        }
        catch(e){
            this.dictionary = new Dictionary();
            this.cache = undefined;
            console.log('IndexedDB cache initialization failed, using in-memory caching!');
        }
    }

    async getOrPutAndGet<T>(key: string, value: () => Promise<T>, ttl: number): Promise<T> {
        const g = await this.get<T>(key)
        if (g == undefined) {
            const v : T = await value();
            if (v)
                await this.put<T>(key, v, ttl);
            return v;
        } else {
            return g;
        }
    }

    async get<T>(key: string): Promise<T | undefined> {
        let c: CacheElement<T> | undefined = undefined
        if (this.cache != undefined)
            c = await this.cache.get(DB_CACHE_OBJECT_STORE, key) as CacheElement<T>;
        else if (this.dictionary != undefined)
            c = this.dictionary.get(key)
                
        if (c == undefined || c.exp < new Date().getTime() / 1000)
            return undefined;
        else
            return c.data;
    }

    // TTL in seconds!! 
    async put<T>(key: string, value: T, ttl: number = 3600) : Promise<any> {
        const c = {
            exp: new Date().getTime() / 1000 + ttl,
            data: value
        };
        if (this.cache != undefined)
            await this.cache.put(DB_CACHE_OBJECT_STORE, c, key);
        else if (this.dictionary != undefined)
            this.dictionary.put(key, c);
    }
}
interface __Dictionary<V> {
    [Key: string]: V;
}

declare global {
    interface Array<T> {
        toDictionary<V>(keySelector: (t: T) => string, valueSelector: (v: T) => V): Dictionary<V>;
    }
}
Array.prototype.toDictionary = function<V>(keySelector: (t: any) => string, valueSelector: (v: any) => V): Dictionary<V> {
    const result = new Dictionary<V>();
    this.forEach((value) => {
        result.put(keySelector(value), valueSelector(value));
    });
    return result;
}

export default class Dictionary<V> {
    private dictionary: __Dictionary<V> = {};
    length: number = 0;

    put(key: string, value: V) {
        if(this.dictionary[key] == undefined)
            this.length += 1;
        this.dictionary[key] = value;
    }
    remove(key: string) {
        if(this.dictionary[key] != undefined)
            this.length -= 1;
        delete this.dictionary[key];
    }
    get(key: string) : V | undefined {
        return this.dictionary[key]
    }
    getAll(): V[] {
        return Object.values(this.dictionary);
    }
}

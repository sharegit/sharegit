interface __Dictionary<V> {
    [Key: string]: V;
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

import Dictionary from "util/Dictionary";

export default class LocalStorageDictionary<T = any> {
    private storageName: string;

    constructor(storageName: string) {
        this.storageName = storageName;
    }

    private open(): Dictionary<T> {
        const dictionary = localStorage.getItem(this.storageName)
        if(dictionary == null)
            return new Dictionary();
        else
            return Object.assign(new Dictionary<T>(), JSON.parse(dictionary) as Dictionary<T>);
    }
    private close(dictionary: Dictionary<T>) {
        localStorage.setItem(this.storageName, JSON.stringify(dictionary));
    }
    getAll(): T[] {
        const dictionary = this.open();
        return dictionary.getAll();
    }

    get(key: string): T | undefined {
        const dictionary: Dictionary<T> = this.open();

        return dictionary.get(key);
    }
    put(key: string, value: T) {
        const dictionary: Dictionary<T> = this.open();

        dictionary.put(key, value);
        this.close(dictionary);
    }
    remove(token: string) {
        const dictionary: Dictionary<T> = this.open();

        dictionary.remove(token);
        this.close(dictionary);
    }
}
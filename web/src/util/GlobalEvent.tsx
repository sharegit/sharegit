class GlobalEvent<T = any> {
    private globalContainer: HTMLElement;
    private eventBus: string;
    private listener: ((event: CustomEvent<T>) => void) | undefined = undefined;

    private __nativeListener: ((event: Event) => void) =
    ((event: Event) => {
        if(this.listener != undefined){
            const customEvent = event as CustomEvent<T>;
            if (customEvent != undefined && customEvent != null) {
                this.listener(customEvent);
            }
        }
    }).bind(this);

    constructor(eventBus: string) {
        this.eventBus = eventBus;
        const container = document.getElementById("container");
        if (container != null)
            this.globalContainer = container;
        else
            throw new Error('You can only create a new GlobalEvent after the DOM has been initialized!');
    }

    dispatch(value: T | undefined = undefined) {
        const linkVisitedEvent = new CustomEvent<T>(this.eventBus, value);
        this.globalContainer.dispatchEvent(linkVisitedEvent);
    }

    addListener(listener: (event: Event) => void) {
        this.listener = listener;
        this.globalContainer.addEventListener(this.eventBus, this.__nativeListener);
    }

    removeListener() {
        this.globalContainer.removeEventListener(this.eventBus, this.__nativeListener);
    }
}

export default GlobalEvent
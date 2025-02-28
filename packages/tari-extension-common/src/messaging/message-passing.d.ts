export type AllowedActions = Record<string, {
    request: unknown;
    response: unknown;
}>;
interface MessageRequest<T extends AllowedActions, K extends keyof T> {
    correlationId: string;
    command: K;
    data: T[K]["request"];
}
interface MessageResponse<T extends AllowedActions, K extends keyof T> {
    correlationId: string;
    command: K;
    response: T[K]["response"];
}
export type Message<T extends AllowedActions> = MessageRequest<T, keyof T> | MessageResponse<T, keyof T>;
interface MessengerOptions<T extends AllowedActions> {
    sendMessage: (msg: Message<T>) => void;
    onMessage: (callback: (msg: Message<T>) => void) => void;
}
export declare class Messenger<T extends AllowedActions> {
    private options;
    private pendingRequests;
    private handlers;
    constructor(options: MessengerOptions<T>);
    send<K extends keyof T>(command: K, data: T[K]["request"]): Promise<T[K]["response"]>;
    registerHandler<K extends keyof T>(command: K, handler: (request: T[K]["request"]) => Promise<T[K]["response"]>): void;
    private handleMessage;
}
export {};

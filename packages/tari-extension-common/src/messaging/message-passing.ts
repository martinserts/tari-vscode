export type AllowedActions = Record<string, { request: unknown; response: unknown }>;

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

export class Messenger<T extends AllowedActions> {
  private pendingRequests = new Map<string, (response: unknown) => void>();
  private handlers = new Map<keyof T, (request: unknown) => Promise<unknown>>();

  constructor(private options: MessengerOptions<T>) {
    options.onMessage((msg) => this.handleMessage(msg));
  }

  public send<K extends keyof T>(command: K, data: T[K]["request"]): Promise<T[K]["response"]> {
    return new Promise((resolve) => {
      const correlationId = crypto.randomUUID();
      this.pendingRequests.set(correlationId, resolve);
      this.options.sendMessage({ correlationId, command, data });
    });
  }

  public registerHandler<K extends keyof T>(
    command: K,
    handler: (request: T[K]["request"]) => Promise<T[K]["response"]>,
  ) {
    this.handlers.set(command, handler);
  }

  private async handleMessage(msg: Message<T>) {
    if ("response" in msg) {
      const resolve = this.pendingRequests.get(msg.correlationId);
      if (resolve) {
        this.pendingRequests.delete(msg.correlationId);
        resolve(msg.response);
      }
    } else {
      const handler = this.handlers.get(msg.command);
      if (!handler) return;

      const response = await handler(msg.data);
      this.options.sendMessage({
        correlationId: msg.correlationId,
        command: msg.command,
        response,
      });
    }
  }
}

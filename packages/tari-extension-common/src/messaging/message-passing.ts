interface MessageDefinition<RequestType, ResponseType> {
  request: RequestType;
  response: ResponseType;
}

type ActionName = string | number | symbol;

export type AllowedActions<T extends ActionName> = Record<T, MessageDefinition<unknown, unknown>>;

interface MessageRequest<K extends ActionName, T extends AllowedActions<K>> {
  correlationId: string;
  command: K;
  data: T[K]["request"];
}

interface MessageResponse<K extends ActionName, T extends AllowedActions<K>> {
  correlationId: string;
  command: K;
  response: T[K]["response"];
}

export type Message<K extends ActionName, T extends AllowedActions<K>> =
  | MessageRequest<K, T>
  | MessageResponse<K, T>;

interface MessengerOptions<T extends AllowedActions<keyof T>> {
  sendMessage: (msg: Message<keyof T, T>) => void;
  onMessage: (callback: (msg: Message<keyof T, T>) => void) => void;
}

export class Messenger<T extends AllowedActions<keyof T>> {
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

  private async handleMessage(msg: Message<keyof T, T>) {
    if ("response" in msg) {
      const resolve = this.pendingRequests.get(msg.correlationId);
      if (resolve) {
        this.pendingRequests.delete(msg.correlationId);
        resolve(msg.response);
      }
    } else {
      const handler = this.handlers.get(msg.command);
      if (!handler) return;

      const response = await handler(msg.data) ?? null;
      this.options.sendMessage({
        correlationId: msg.correlationId,
        command: msg.command,
        response,
      });
    }
  }
}

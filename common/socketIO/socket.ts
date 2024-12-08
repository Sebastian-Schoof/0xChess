import { WebSocket as WS } from "ws";
import { defaultPort } from "./const";
import { ClientSocketMessage, ServerSocketMessage } from "./types";

type SocketMessage = ClientSocketMessage | ServerSocketMessage;
type CallBacks<T extends SocketMessage> = Partial<{
    [key in keyof T]: ((data: T[key]) => void)[];
}>;

class Socket<
    OutMessage extends SocketMessage,
    InMessage extends SocketMessage,
> {
    private socket?: WS | WebSocket;
    private messageCallbacks: CallBacks<InMessage> = {};
    private closeCallbacks: (() => void)[] = [];

    public connect: () => void;

    constructor(
        parameters:
            | { type: "client"; address: string; onOpen?: () => void }
            | { type: "server"; connection: WS },
    ) {
        this.connect = () => {
            switch (parameters.type) {
                case "client":
                    const socket = new WebSocket(parameters.address);
                    socket.addEventListener("open", () => {
                        parameters.onOpen?.();
                        socket.addEventListener("message", (message) => {
                            this.onMessage(message);
                        });
                        socket.addEventListener("close", () => {
                            this.onClose();
                        });
                        this.socket = socket;
                    });
                    break;
                case "server":
                    parameters.connection.on("message", (message) => {
                        this.onMessage(message);
                    });
                    parameters.connection.on("close", () => {
                        this.onClose();
                    });
                    this.socket = parameters.connection;
                    break;
            }
        };
        this.connect();
    }

    private onMessage(message: any) {
        const [messageType, messageData] = Object.entries(
            JSON.parse(message.data ?? message), //TODO: maybe try catch
        )[0] as [keyof InMessage, InMessage[keyof InMessage]];
        this.messageCallbacks[messageType]?.forEach((cb) => cb(messageData));
    }

    private onClose() {
        this.closeCallbacks?.forEach((cb) => cb());
    }

    async opened() {}

    get state() {
        return this.socket?.readyState ?? WebSocket.CLOSED;
    }

    sendMessage<K extends keyof OutMessage>(message: Pick<OutMessage, K>) {
        this.socket?.send(JSON.stringify(message)); //TODO: maybe queue and send after recovery
    }

    addMessageHandler<K extends keyof InMessage>(
        type: K,
        callBack: (data: InMessage[K]) => void,
    ) {
        this.messageCallbacks[type] = (
            this.messageCallbacks[type] ?? []
        ).concat(callBack);
    }

    removeMessageHandler<K extends keyof InMessage>(
        type: K,
        callBack: (data: InMessage[K]) => void,
    ) {
        this.messageCallbacks[type] = this.messageCallbacks[type]?.filter(
            (cb) => cb !== callBack,
        );
    }

    clearMessageHandler(type: keyof InMessage) {
        this.messageCallbacks[type] = [];
    }

    addCloseHandler(callBack: () => void) {
        this.closeCallbacks = (this.closeCallbacks ?? []).concat(callBack);
    }

    removeCloseHandler(callBack: () => void) {
        this.closeCallbacks = this.closeCallbacks?.filter(
            (cb) => cb !== callBack,
        );
    }

    close() {
        this.socket?.close(); //TODO: maybe also cancel reconnect
    }
}
export type ServerSocket = Socket<ServerSocketMessage, ClientSocketMessage>;

export function openServerSocket(
    onConnect: (ws: Socket<ServerSocketMessage, ClientSocketMessage>) => void,
) {
    const wss = process.env.certFolder
        ? (() => {
              const { readFileSync } = require("fs");
              const { createServer } = require("https");
              const { join } = require("path");
              const server = createServer({
                  cert: readFileSync(
                      join(process.env.certFolder, "fullchain.pem"),
                  ),
                  key: readFileSync(
                      join(process.env.certFolder, "privkey.pem"),
                  ),
              });
              const wss = new WS.Server({
                  port: server ? undefined : +process.env.VITE_PORT! || defaultPort,
                  server,
              });
              server.listen(+process.env.VITE_PORT! || defaultPort);
              return wss;
          })()
        : new WS.Server({
              port: +process.env.VITE_PORT! || defaultPort,
          });

    wss.on("connection", (ws) =>
        onConnect(new Socket({ type: "server", connection: ws })),
    );
}

export type ClientSocket = Socket<ClientSocketMessage, ServerSocketMessage>;

export const openClientSocket = (onOpen: () => void) =>
    new Socket({
        type: "client",
        address: `${window.location.protocol === "https:" ? "wss" : "ws"}://${
           import.meta.env.VITE_HOST ?? window.location.hostname
        }:${import.meta.env.VITE_PORT ?? defaultPort}`,
        onOpen,
    }) as ClientSocket;

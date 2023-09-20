import { WebSocket as WS } from "ws";
import { defaultPort } from "./const";
import { ClientSocketMessage, ServerSocketMessage } from "./types";

type SocketMessage = ClientSocketMessage | ServerSocketMessage;
type CallBacks<T extends SocketMessage> = Partial<{
    [key in keyof T]: ((data: T[key]) => void)[];
}>;

class Socket<
    OutMessage extends SocketMessage,
    InMessage extends SocketMessage
> {
    private socket: WS | WebSocket;
    private messageCallbacks: CallBacks<InMessage> = {};
    private closeCallbacks: (() => void)[] = [];
    constructor(socket: WS | WebSocket, onClose?: () => void) {
        this.socket = socket;
        const onMessage = (message: any) => {
            const [messageType, messageData] = Object.entries(
                JSON.parse(message.data ?? message) //TODO: maybe try catch
            )[0] as [keyof InMessage, InMessage[keyof InMessage]];
            this.messageCallbacks[messageType]?.forEach((cb) =>
                cb(messageData)
            );
        };
        switch (this.socket.constructor) {
            case WS:
                (socket as WS).on("message", onMessage);
                if (onClose) (socket as WS).on("close", onClose);
                break;
            case WebSocket:
                (socket as WebSocket).addEventListener("message", onMessage);
                if (onClose)
                    (socket as WebSocket).addEventListener("close", onClose);
                break;
        }
    }

    get state() {
        return this.socket.readyState;
    }

    sendMessage<K extends keyof OutMessage>(message: Pick<OutMessage, K>) {
        this.socket.send(JSON.stringify(message));
    }

    addMessageHandler<K extends keyof InMessage>(
        type: K,
        callBack: (data: InMessage[K]) => void
    ) {
        this.messageCallbacks[type] = (
            this.messageCallbacks[type] ?? []
        ).concat(callBack);
    }

    removeMessageHandler<K extends keyof InMessage>(
        type: K,
        callBack: (data: InMessage[K]) => void
    ) {
        this.messageCallbacks[type] = this.messageCallbacks[type]?.filter(
            (cb) => cb !== callBack
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
            (cb) => cb !== callBack
        );
    }

    close() {
        this.socket.close();
    }
}
export type ServerSocket = Socket<ServerSocketMessage, ClientSocketMessage>;

export const openSocketServer = () =>
    new WS.Server({
        port: +process.env.PORT! || defaultPort,
    });

export function openServerSocket(
    onConnect: (ws: Socket<ServerSocketMessage, ClientSocketMessage>) => void
) {
    const wss = new WS.Server({
        port: +process.env.PORT! || defaultPort,
    });
    wss.on("connection", (ws) => onConnect(new Socket(ws)));
}

export type ClientSocket = Socket<ClientSocketMessage, ServerSocketMessage>;

export function openClientSocket(onOpen: () => void, onClose?: () => void) {
    const ws = new WebSocket(
        `ws://${window.location.hostname}:${process.env.PORT ?? defaultPort}`
    );
    ws.addEventListener("open", onOpen);
    return new Socket<ClientSocketMessage, ServerSocketMessage>(ws, onClose);
}

import { defaultPort } from "common/socketIO/const";
import { Socket, type ClientSocket } from "common/socketIO/socket";

export const openClientSocket = (onOpen: () => void) =>
    new Socket({
        type: "client",
        address: `${window.location.protocol === "https:" ? "wss" : "ws"}://${
            import.meta.env.VITE_HOST ?? window.location.hostname
        }:${import.meta.env.VITE_PORT ?? defaultPort}`,
        onOpen,
    }) as ClientSocket;

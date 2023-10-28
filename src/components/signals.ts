import { signal } from "@preact/signals";
import { BoardSide } from "game/types";
import { ClientSocket } from "socketIO/socket";

export const socket = signal<ClientSocket | undefined>(undefined);

export const socketConnectionStatus = signal<number>(WebSocket.CLOSED);

export const sendNotifications = signal(false);

export const sceneInitiated = signal(false);

export const game = signal<Phaser.Game | undefined>(undefined);

export const gameScale = signal<number>(1);

export const gameState = signal<
    | { side: BoardSide; toMove: BoardSide }
    | { side: BoardSide; gameState: "won" | "lost" }
    | undefined
>(undefined);

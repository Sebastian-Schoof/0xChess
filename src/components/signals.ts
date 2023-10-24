import { signal } from "@preact/signals";
import { BoardSide } from "game/types";
import { ClientSocket } from "socketIO/socket";

export const socket = signal<ClientSocket | undefined>(undefined);

export const sceneInitiated = signal(false);

export const gameState = signal<
    | { side: BoardSide; toMove: BoardSide }
    | { side: BoardSide; gameState: "won" | "lost" }
    | undefined
>(undefined);

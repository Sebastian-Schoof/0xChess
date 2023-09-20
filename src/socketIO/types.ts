import type { initialBoardSetup } from "../game/Pieces";
import type { BoardSide, Move } from "../game/types";

export type ServerSocketMessage = {
    initialSetup: {
        side: BoardSide;
        pieces: typeof initialBoardSetup;
        toMove: BoardSide;
    };
} & { friendCode: string } & MoveMessage;

export type ClientSocketMessage = {
    requestGame: "friend" | "random";
} & {
    joinGame: string;
} & MoveMessage;

type MoveMessage = { move: Move };

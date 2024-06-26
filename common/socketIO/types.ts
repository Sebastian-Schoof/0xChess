import type { initialBoardSetup } from "common/game/Pieces";
import type { BoardSide, Move } from "common/game/types";

export type ServerSocketMessage = {
    initialSetup: {
        side: BoardSide;
        pieces: typeof initialBoardSetup;
        toMove: BoardSide;
    };
} & { friendCode: string } & MoveMessage & {
        gameStatus: "won" | "lost" | "drew" | "opponent quit";
    };

export type ClientSocketMessage = { identity: string } & {
    requestGame: "friend" | "random";
} & {
    joinGame: string;
} & MoveMessage & { gameStatus: "quit" };

type MoveMessage = { move: Move };

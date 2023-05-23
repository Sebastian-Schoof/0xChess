import type { initialBoardSetup } from "../game/Pieces";
import type { BoardSide, Move } from "../game/types";

export type SocketMessage =
    | {
          type: "initialSetup";
          data: {
              side: BoardSide;
              pieces: typeof initialBoardSetup;
          };
      }
    | {
          type: "move";
          data: Move;
      };

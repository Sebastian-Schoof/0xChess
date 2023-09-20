import { initialBoardSetup } from "game/Pieces";
import { BoardPiece, BoardSide, boardSides } from "game/types";
import { ServerSocket } from "socketIO/socket";

export class ServerState {
    private games: ({
        connections: { [side in BoardSide]?: ServerSocket };
        state: { pieces: BoardPiece[]; toMove: BoardSide };
        code?: string;
    } | null)[] = [];

    getGameById(gameId: number) {
        return this.games[gameId];
    }

    joinGame(socket: ServerSocket, code?: string) {
        for (let gameId = 0; gameId < this.games.length; gameId++) {
            if (!this.games[gameId]) continue;
            if (code && this.games[gameId]?.code !== code) continue;
            for (let side of boardSides)
                if (this.games[gameId]!.connections[side] === undefined) {
                    this.games[gameId]!.connections[side] = socket;
                    return [side, gameId] as const;
                }
        }

        const side = boardSides[Math.floor(Math.random() * 2)]!;
        let gameId = this.games.indexOf(null);
        if (gameId == -1) {
            gameId = this.games.length;
        }
        this.games[gameId] = {
            connections: { [side]: socket },
            state: {
                pieces: structuredClone(initialBoardSetup),
                toMove: "white",
            },
            code,
        };
        return [side, gameId] as const;
    }

    closeGame(gameId: number) {
        boardSides.forEach((side) =>
            this.games[gameId]?.connections[side]?.close()
        );
        this.games[gameId] = null;
    }
}

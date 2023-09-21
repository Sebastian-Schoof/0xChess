import { initialBoardSetup } from "game/Pieces";
import { BoardPiece, BoardSide, boardSides } from "game/types";
import { ServerSocket } from "socketIO/socket";

export class ServerState {
    private games: ({
        connections: {
            [side in BoardSide]?: { userId: string; socket?: ServerSocket };
        };
        state: { pieces: BoardPiece[]; toMove: BoardSide };
        code?: string;
    } | null)[] = [];

    private gamePruningTimeouts: Record<number, NodeJS.Timeout> = {};

    getGameById(gameId: number) {
        return this.games[gameId];
    }

    getJoinedGameForUser(userId: string) {
        let foundSide: BoardSide | undefined;
        let foundGameId: number | undefined;
        for (let gameId = 0; gameId < this.games.length; gameId++) {
            if (!this.games[gameId]) continue;
            for (const connectionSide of boardSides) {
                if (
                    this.games[gameId]!.connections[connectionSide]?.userId ===
                    userId
                ) {
                    foundSide = connectionSide;
                    foundGameId = gameId;
                    clearTimeout(this.gamePruningTimeouts[gameId]);
                    delete this.gamePruningTimeouts[gameId];
                    gameId = this.games.length;
                    break;
                }
            }
        }
        return foundSide !== undefined && foundGameId !== undefined
            ? ([foundSide, foundGameId] as const)
            : null;
    }

    joinNewGame(userId: string, socket: ServerSocket, code?: string) {
        for (let gameId = 0; gameId < this.games.length; gameId++) {
            if (!this.games[gameId]) continue;
            if (this.games[gameId]?.code !== code) continue;
            for (let side of boardSides)
                if (this.games[gameId]!.connections[side] === undefined) {
                    this.games[gameId]!.connections[side] = { userId, socket };
                    return [side, gameId] as const;
                }
        }

        const side = boardSides[Math.floor(Math.random() * 2)]!;
        let gameId = this.games.indexOf(null);
        if (gameId == -1) {
            gameId = this.games.length;
        }
        this.games[gameId] = {
            connections: { [side]: { userId, socket } },
            state: {
                pieces: structuredClone(initialBoardSetup),
                toMove: "white",
            },
            code,
        };
        return [side, gameId] as const;
    }

    leaveGame(gameId: number, userId: string) {
        const side = boardSides.find(
            (side) => this.games[gameId]?.connections[side]?.userId === userId
        );
        const connection = this.games[gameId]?.connections[side!];
        if (connection) {
            connection.socket?.close();
            connection.socket = undefined;
        }

        if (
            !boardSides.some(
                (side) => this.games[gameId]?.connections[side]?.socket
            )
        )
            this.gamePruningTimeouts[gameId] = setTimeout(() => {
                this.closeGame(gameId);
            }, 3600 * 48);
    }

    closeGame(gameId: number) {
        boardSides.forEach((side) =>
            this.games[gameId]?.connections[side]?.socket?.close()
        );
        this.games[gameId] = null;
    }
}

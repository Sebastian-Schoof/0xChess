import { createGame, endGame, getGameByUserId } from "db/interface/games";
import { initialBoardSetup } from "game/Pieces";
import { BoardPiece, BoardSide, boardSides } from "game/types";
import { ServerSocket } from "socketIO/socket";
import { generateGameId } from "./utils";

export class ServerState {
    private games = new Map<
        string,
        {
            connections: {
                [side in BoardSide]?: { userId: string; socket?: ServerSocket };
            };
            state: { pieces: BoardPiece[]; toMove: BoardSide };
            code?: string;
        }
    >();

    getGameById(gameId: string) {
        return this.games.get(gameId);
    }

    getJoinedGameForUser(userId: string, socket: ServerSocket) {
        let foundSide: BoardSide | undefined;
        let foundGameId: string | undefined;
        for (let [gameId, game] of this.games) {
            for (const connectionSide of boardSides) {
                if (game.connections[connectionSide]?.userId === userId) {
                    game.connections[connectionSide]!.socket = socket;
                    foundSide = connectionSide;
                    foundGameId = gameId;
                    break;
                }
            }
            if (foundSide && foundGameId) break;
        }

        if (!foundSide || !foundGameId) {
            const joinedGame = getGameByUserId(userId);
            if (joinedGame) {
                this.games.set(joinedGame.gameId, joinedGame.game);
                foundSide = Object.entries(joinedGame.game.connections).find(
                    ([, { userId: connectionUserId }]) =>
                        connectionUserId === userId,
                )?.[0] as BoardSide;
                foundGameId = joinedGame.gameId;
                const cachedGame = this.games.get(joinedGame.gameId);
                cachedGame!.connections[foundSide]!.socket = socket;
            }
        }

        return foundSide !== undefined && foundGameId !== undefined
            ? ([foundSide, foundGameId] as const)
            : null;
    }

    joinNewGame(userId: string, socket: ServerSocket, code?: string) {
        for (let [gameId, game] of this.games) {
            if (game.code !== code) continue;
            for (let side of boardSides)
                if (game.connections[side] === undefined) {
                    game.connections[side] = { userId, socket };
                    createGame(
                        gameId,
                        game as typeof game & {
                            connections: {
                                [side in BoardSide]: { userId: string };
                            };
                        },
                    );
                    return [side, gameId] as const;
                }
        }

        const side = boardSides[Math.floor(Math.random() * 2)]!;
        const gameId = generateGameId();

        this.games.set(gameId, {
            connections: { [side]: { userId, socket } },
            state: {
                pieces: structuredClone(initialBoardSetup),
                toMove: "white",
            },
            code,
        });

        return [side, gameId] as const;
    }

    leaveGame(gameId: string, userId: string) {
        const side = boardSides.find(
            (side) =>
                this.games.get(gameId)?.connections[side]?.userId === userId,
        );
        const connection = this.games.get(gameId)?.connections[side!];
        if (connection) {
            connection.socket?.close();
            connection.socket = undefined;
        }

        if (
            !boardSides.some(
                (side) => this.games.get(gameId)?.connections[side]?.socket,
            )
        )
            endGame(gameId);
    }

    closeGame(gameId: string) {
        this.games.delete(gameId);
        endGame(gameId);
    }
}

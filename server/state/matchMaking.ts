import { generateRandomCode } from "common/utils/random";
import { SessionStateManager } from "./sessionStateManager";
import { SessionState } from "./types";

export class Matchmaking implements SessionState {
    constructor(private stateManager: SessionStateManager) {}

    public enter() {
        this.stateManager.socket.addMessageHandler("identity", (userId) => {
            this.stateManager.userId = userId;
            const joinedGame =
                this.stateManager.serverState.getJoinedGameForUser(
                    userId,
                    this.stateManager.socket,
                );
            if (joinedGame) {
                this.stateManager.next(joinedGame);
            }
        });
        this.stateManager.socket.addMessageHandler(
            "requestGame",
            (opponent) => {
                if (!this.stateManager.userId) return;
                switch (opponent) {
                    case "friend":
                        const friendCode = generateRandomCode(4);
                        this.stateManager.socket.sendMessage({ friendCode });
                        var gameInfo =
                            this.stateManager.serverState.joinNewGame(
                                this.stateManager.userId,
                                this.stateManager.socket,
                                friendCode,
                            );
                        break;
                    case "random":
                        var gameInfo =
                            this.stateManager.serverState.joinNewGame(
                                this.stateManager.userId,
                                this.stateManager.socket,
                            );
                        break;
                }
                this.stateManager.next(gameInfo);
            },
        );
        this.stateManager.socket.addMessageHandler("joinGame", (friendCode) => {
            if (!this.stateManager.userId) return;
            const gameInfo = this.stateManager.serverState.joinNewGame(
                this.stateManager.userId,
                this.stateManager.socket,
                friendCode.toUpperCase(),
            );
            this.stateManager.next(gameInfo);
        });
    }

    public leave() {
        this.stateManager.socket.clearMessageHandler("requestGame");
        this.stateManager.socket.clearMessageHandler("joinGame");
    }
}

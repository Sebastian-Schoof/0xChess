import { BoardSide } from "game/types";
import { SessionStateManager } from "./sessionStateManager";
import { SessionState } from "./types";
import { generateFriendCode } from "./utils";

export class Matchmaking implements SessionState {
    constructor(private stateManager: SessionStateManager) {}

    public enter() {
        this.stateManager.socket.addMessageHandler(
            "requestGame",
            (opponent) => {
                let gameInfo: readonly [BoardSide, number] | undefined =
                    undefined;
                switch (opponent) {
                    case "friend":
                        const friendCode = generateFriendCode(4);
                        this.stateManager.socket.sendMessage({ friendCode });
                        gameInfo = this.stateManager.serverState.joinGame(
                            this.stateManager.socket,
                            friendCode
                        );
                        break;
                    case "random":
                        gameInfo = this.stateManager.serverState.joinGame(
                            this.stateManager.socket
                        );
                        break;
                }
                this.stateManager.next(gameInfo);
            }
        );
        this.stateManager.socket.addMessageHandler("joinGame", (friendCode) => {
            const gameInfo = this.stateManager.serverState.joinGame(
                this.stateManager.socket,
                friendCode
            );
            this.stateManager.next(gameInfo);
        });
    }

    public leave() {
        this.stateManager.socket.clearMessageHandler("requestGame");
        this.stateManager.socket.clearMessageHandler("joinGame");
    }
}

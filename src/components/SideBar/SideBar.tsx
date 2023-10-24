import { gameState, socket } from "components/signals";
import componentStyles from "components/styles.module.css";
import styles from "./styles.module.css";

export default function SideBar({ onLeaveGame }: { onLeaveGame: () => void }) {
    const state = gameState.value;

    let statusMessage: string | undefined = undefined;
    if (state && "toMove" in state) statusMessage = `${state.toMove} to move`;
    if (state && "gameState" in state) statusMessage = `you ${state.gameState}`;

    return (
        <div className={styles.sideBar}>
            <div>you play {state?.side}</div>
            {statusMessage && <div>{statusMessage}</div>}
            <div
                className={componentStyles.button}
                onClick={() => {
                    gameState.value = undefined;
                    socket.value?.sendMessage({ gameStatus: "quit" });
                    onLeaveGame();
                }}
            >
                leave game
            </div>
        </div>
    );
}
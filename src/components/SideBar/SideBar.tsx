import { updateZoom } from "components/Game/utils";
import { gameState, socket } from "components/signals";
import componentStyles from "components/styles.module.css";
import { useLayoutEffect } from "preact/hooks";
import styles from "./styles.module.css";

export default function SideBar({ onLeaveGame }: { onLeaveGame: () => void }) {
    const state = gameState.value;

    let statusMessage: string | undefined = undefined;
    if (state && "toMove" in state) statusMessage = `${state.toMove} to move`;
    if (state && "gameState" in state) statusMessage = `you ${state.gameState}`;

    useLayoutEffect(updateZoom, []);

    return (
        <div className={styles.sideBar}>
            <div className={styles.messageConatiner}>
                <div>you play {state?.side}</div>
                {statusMessage && <div>{statusMessage}</div>}
            </div>
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

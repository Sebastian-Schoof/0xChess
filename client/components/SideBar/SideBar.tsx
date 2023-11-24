import { updateZoom } from "components/Game/utils";
import { styles as componentStyles } from "components/general";
import { useLayoutEffect, useState } from "preact/hooks";
import { Settings } from "./Settings";
import styles from "./styles.module.css";
import GearIcon from "/assets/gear.svg";
import { gameState, socket } from "signals";

export default function SideBar({ onLeaveGame }: { onLeaveGame: () => void }) {
    const [showSettings, setShowSettings] = useState(false);

    const state = gameState.value;

    let statusMessage: string | undefined = undefined;
    if (state && "toMove" in state) statusMessage = `${state.toMove} to move`;
    if (state && "gameState" in state) statusMessage = `you ${state.gameState}`;

    useLayoutEffect(updateZoom, []);

    return (
        <>
            {showSettings && (
                <Settings closeSettings={() => setShowSettings(false)} />
            )}
            <div className={styles.sideBar}>
                <img
                    className={
                        showSettings
                            ? `${styles.settingsIcon} ${styles.active}`
                            : styles.settingsIcon
                    }
                    src={GearIcon}
                    onClick={() => {
                        setShowSettings((showSettings) => !showSettings);
                    }}
                />
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
        </>
    );
}

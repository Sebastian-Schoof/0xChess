import { styles as componentStyles } from "components/general";
import { useRef, useState } from "preact/hooks";
import { socket } from "signals";
import styles from "./styles.module.css";
import BackButton from "/assets/back.svg";

export default function Lobby() {
    const [askFriendCode, setAskFriendCode] = useState(false);

    return (
        <dialog className={styles.lobby}>
            {askFriendCode ? (
                <FriendCode
                    navigateBack={() => {
                        setAskFriendCode(false);
                    }}
                />
            ) : (
                <>
                    <div
                        className={componentStyles.button}
                        onClick={() => setAskFriendCode(true)}
                    >
                        play friend
                    </div>
                    <div
                        className={componentStyles.button}
                        onClick={() => {
                            socket.value?.sendMessage({
                                requestGame: "random",
                            });
                        }}
                    >
                        play random
                    </div>
                </>
            )}
        </dialog>
    );
}

function FriendCode({ navigateBack }: { navigateBack: () => void }) {
    const [friendCode, setfriendCode] = useState<string | undefined>(undefined);
    const inputRef = useRef<HTMLInputElement>(null);

    return (
        <>
            {friendCode ? (
                <>
                    <div>your code is:</div>
                    <strong className={styles.friendCode}>{friendCode}</strong>
                </>
            ) : (
                <>
                    <img
                        src={BackButton}
                        className={styles.backButton}
                        onClick={navigateBack}
                    />
                    <div
                        className={componentStyles.button}
                        style={{ alignSelf: "center" }}
                        onClick={() => {
                            socket.value?.addMessageHandler(
                                "friendCode",
                                setfriendCode,
                            );
                            socket.value?.sendMessage({
                                requestGame: "friend",
                            });
                        }}
                    >
                        create new game
                    </div>
                    <div className={styles.joinArea}>
                        <input
                            className={componentStyles.input}
                            placeholder="friend code"
                            ref={inputRef}
                        />
                        <div
                            className={componentStyles.button}
                            onClick={() =>
                                inputRef.current?.value &&
                                socket.value?.sendMessage({
                                    joinGame: inputRef.current?.value,
                                })
                            }
                        >
                            join game
                        </div>
                    </div>
                </>
            )}
        </>
    );
}

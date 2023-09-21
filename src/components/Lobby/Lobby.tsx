import { socket } from "components/signals";
import { useRef, useState } from "preact/hooks";
import styles from "./styles.module.css";

export default function Lobby() {
    const [askFriendCode, setAskFriendCode] = useState(false);

    return (
        <dialog className={styles.lobby}>
            {askFriendCode ? (
                <FriendCode />
            ) : (
                <>
                    <div
                        className={styles.button}
                        onClick={() => setAskFriendCode(true)}
                    >
                        play friend
                    </div>
                    <div
                        className={styles.button}
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

//TODO: add back button
function FriendCode() {
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
                    <div
                        className={styles.button}
                        style={{ alignSelf: "center" }}
                        onClick={() => {
                            socket.value?.addMessageHandler(
                                "friendCode",
                                setfriendCode
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
                            className={styles.input}
                            placeholder="friend code"
                            ref={inputRef}
                        />
                        <div
                            className={styles.button}
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

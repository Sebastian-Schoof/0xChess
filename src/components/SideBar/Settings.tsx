import { Toggle, styles as componentStyles } from "components/general";
import { sendNotifications } from "components/signals";
import styles from "./styles.module.css";

export function Settings({ closeSettings }: { closeSettings: () => void }) {
    return (
        <dialog className={styles.settingsDialog}>
            {"Notification" in window && (
                <Toggle
                    label="receive a notification when it's your turn"
                    value={sendNotifications.value}
                    onChange={(newValue) => {
                        if (
                            newValue &&
                            Notification?.permission !== "granted"
                        ) {
                            Notification?.requestPermission().then(
                                (permission) => {
                                    if (permission === "denied")
                                        sendNotifications.value = false;
                                },
                            );
                        }
                        sendNotifications.value = newValue;
                        localStorage["sendNotifications"] = newValue;
                    }}
                />
            )}
            <div className={componentStyles.button} onClick={closeSettings}>
                okay
            </div>
        </dialog>
    );
}

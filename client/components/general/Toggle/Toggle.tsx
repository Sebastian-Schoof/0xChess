import styles from "./styles.module.css";
export default function Toggle({
    value,
    onChange,
    label,
}: {
    value: boolean;
    onChange: (newValue: boolean) => void;
    label?: string;
}) {
    return (
        <div className={styles.switchBox}>
            <label className={styles.switch}>
                <input
                    type="checkbox"
                    className={styles.checkBox}
                    value={value ? "on" : "off"}
                    checked={value}
                    onChange={(e) => {
                        e.target &&
                            onChange(
                                (
                                    e.target as typeof e.target & {
                                        checked: boolean;
                                    }
                                ).checked,
                            );
                    }}
                />
                <span className={`${styles.slider} ${styles.round}`}></span>
            </label>
            <span className={styles.label}>{label}</span>
        </div>
    );
}

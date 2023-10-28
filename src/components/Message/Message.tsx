import styles from "./styles.module.css";

export default function Loading({ text }: { text: string }) {
    return <dialog className={styles.message}>{text}</dialog>;
}

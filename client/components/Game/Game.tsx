import { useEffect, useRef } from "preact/hooks";
import { GameScene } from "./GameScene";
import { PromotionDialog } from "./PromotionDialog";
import { canvasHeight, canvasWidth, elementId } from "./const";
import { showDialog } from "./gamestate";
import styles from "./styles.module.css";
import { updateZoom } from "./utils";
import { game } from "signals";

export default function Game() {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const config: Phaser.Types.Core.GameConfig = {
            type: Phaser.AUTO,
            fps: { limit: 60 },
            parent: elementId,
            width: canvasWidth,
            height: canvasHeight,
            scene: GameScene,
            transparent: true,
            callbacks: { postBoot: updateZoom },
        };

        game.value = new Phaser.Game(config);
        game.value.scale.autoCenter = 4;

        window.addEventListener("resize", updateZoom);
        return () => window.removeEventListener("resize", updateZoom);
    }, []);

    return (
        <>
            <div id={elementId} className={styles.game} ref={ref} />
            {showDialog.value && (
                <PromotionDialog
                    side={showDialog.value.side}
                    onClick={showDialog.value.callBack}
                />
            )}
        </>
    );
}

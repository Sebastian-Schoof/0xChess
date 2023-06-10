import { useEffect, useRef } from "preact/hooks";
import { GameScene } from "./GameScene";
import { PromotionDialog } from "./PromotionDialog";
import { showDialog } from "./gamestate";
import styles from "./styles.module.css";

const canvasWidth = 1805;
const canvasHeight = 1120;

export default function Game() {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const config: Phaser.Types.Core.GameConfig = {
            type: Phaser.AUTO,
            parent: "renderCanvas",
            width: canvasWidth,
            height: canvasHeight,
            scene: GameScene,
            transparent: true,
        };

        const game = new Phaser.Game(config);
        game.scale.autoCenter = 4;

        const updateZoom = () =>
            game.scale.setZoom(
                Math.floor(
                    Math.min(
                        (ref.current?.getBoundingClientRect().width ??
                            canvasWidth) / canvasWidth,
                        (ref.current?.getBoundingClientRect().height ??
                            canvasHeight) / canvasHeight
                    )
                ) || 0.5
            );
        updateZoom();
        window.addEventListener("resize", updateZoom);
        return () => window.removeEventListener("resize", updateZoom);
    }, []);

    return (
        <>
            <div id="renderCanvas" className={styles.game} ref={ref} />
            {showDialog.value && (
                <PromotionDialog
                    side={showDialog.value.side}
                    onClick={showDialog.value.callBack}
                />
            )}
        </>
    );
}

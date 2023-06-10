import { useEffect, useRef, useState } from "preact/hooks";
import { GameScene } from "./GameScene";
import { PromotionDialog } from "./PromotionDialog";
import { showDialog } from "./gamestate";
import styles from "./styles.module.css";

const canvasWidth = 1250;
const canvasHeight = 1120;

export default function Game() {
    const ref = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(1);

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

        const updateZoom = () => {
            const newScale =
                Math.floor(
                    Math.min(
                        (ref.current?.getBoundingClientRect().width ??
                            canvasWidth) / canvasWidth,
                        (ref.current?.getBoundingClientRect().height ??
                            canvasHeight) / canvasHeight
                    )
                ) || 0.5;
            game.scale.setZoom(newScale);
            setScale(newScale);
        };
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
                    scale={scale}
                />
            )}
        </>
    );
}

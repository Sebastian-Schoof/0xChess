import { useEffect, useRef } from "preact/hooks";
import { GameScene } from "game/GameScene";

export default function Game() {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const config: Phaser.Types.Core.GameConfig = {
            type: Phaser.AUTO,
            parent: "renderCanvas",
            width: 240 * 2,
            height: 160 * 2,
            scene: GameScene,
            transparent: true,
        };

        const game = new Phaser.Game(config);
        game.scale.autoCenter = 2;

        const updateZoom = () =>
            game.scale.setZoom(
                Math.floor(
                    Math.min(
                        (ref.current?.getBoundingClientRect().width ??
                            240 * 2) /
                            (240 * 2),
                        (ref.current?.getBoundingClientRect().height ??
                            160 * 2) /
                            (160 * 2)
                    )
                )
            );
        updateZoom();
        window.addEventListener("resize", updateZoom);
        return () => window.removeEventListener("resize", updateZoom);
    });

    return (
        <div
            id="renderCanvas"
            style={{
                width: "100%",
                height: "100%",
                overflow: "hidden",
                imageRendering: "pixelated",
            }}
            ref={ref}
        />
    );
}

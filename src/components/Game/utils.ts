import { game, gameScale } from "components/signals";
import { canvasHeight, canvasWidth, elementId } from "./const";

export function updateZoom() {
    const ref = document.getElementById(elementId);
    const newScale = Math.min(
        (ref?.getBoundingClientRect().width ?? canvasWidth) / canvasWidth,
        (ref?.getBoundingClientRect().height ?? canvasHeight) / canvasHeight,
        1,
    );
    game.value?.scale.setZoom(newScale);
    gameScale.value = newScale;
}

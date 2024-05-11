import { BoardCoordinates } from "./types";

export function isOnBoard(
    coordinates: BoardCoordinates,
    boardSize: BoardCoordinates,
) {
    const offsetR = Math.floor(boardSize.r / 2);
    const offsetQ = Math.floor(boardSize.q / 2) - offsetR / 2;
    for (let r = 0; r < boardSize.r; r++) {
        for (let q = 0; q < boardSize.q - (r % 2); q++) {
            const qAxial = Math.ceil(q - r / 2);
            if (
                coordinates.q === qAxial - offsetQ &&
                coordinates.r === r - offsetR
            )
                return true;
        }
    }
    return false;
}

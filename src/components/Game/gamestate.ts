import { signal } from "@preact/signals";
import { BoardSide, Piece } from "game/types";

export const showDialog = signal<
    { side: BoardSide; callBack: (piece: Piece) => void } | undefined
>(undefined);

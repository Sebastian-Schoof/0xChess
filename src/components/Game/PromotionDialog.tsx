import { BoardSide, Piece } from "game/types";
import { piecePaths } from "./assets";
import styles from "./styles.module.css";

const promotionPieces: Piece[] = ["knight", "bishop", "rook", "queen"];

export function PromotionDialog({
    side,
    onClick,
    scale = 1,
}: {
    side: BoardSide;
    onClick: (piece: Piece) => void;
    scale?: number;
}) {
    return (
        <div
            className={styles.promotionDialog}
            style={{ marginTop: `-${52 * scale}px` }}
        >
            {promotionPieces.map((pieceName) => (
                <img
                    key={pieceName}
                    src={piecePaths[side][pieceName as Piece]}
                    style={{ cursor: "pointer", height: `${90 * scale}px` }}
                    onClick={() => onClick(pieceName)}
                />
            ))}
        </div>
    );
}

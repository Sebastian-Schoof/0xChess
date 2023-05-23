import { BoardSide, Piece } from "game/types";
import { piecePaths } from "./assets";
import styles from "./styles.module.css";

const promotionPieces: Piece[] = ["knight", "bishop", "rook", "queen"];

export function PromotionDialog({
    side,
    onClick,
}: {
    side: BoardSide;
    onClick: (piece: Piece) => void;
}) {
    return (
        <div className={styles.promotionDialog}>
            {promotionPieces.map((pieceName) => (
                <img
                    key={pieceName}
                    src={piecePaths[side][pieceName as Piece]}
                    style={{ cursor: "pointer" }}
                    onClick={() => onClick(pieceName)}
                />
            ))}
        </div>
    );
}

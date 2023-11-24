import { gameScale } from "signals";
import { BoardSide, Piece } from "common/game/types";
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
        <div
            className={styles.promotionDialog}
            style={{ marginTop: `-${52 * gameScale.value}px` }}
        >
            {promotionPieces.map((pieceName) => (
                <img
                    key={pieceName}
                    src={piecePaths[side][pieceName as Piece]}
                    style={{
                        cursor: "pointer",
                        height: `${90 * gameScale.value}px`,
                    }}
                    onClick={() => onClick(pieceName)}
                />
            ))}
        </div>
    );
}

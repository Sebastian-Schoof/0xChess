import { BoardSide, Piece } from "game/types";
import { piecePaths } from "./assets";

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
            style={{
                border: "1px solid",
                borderRadius: "50px",
                display: "flex",
                gap: "8px",
                position: "fixed",
                top: "48px",
                background: "white",
                padding: "2px 8px",
            }}
        >
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

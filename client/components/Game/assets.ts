import { BoardSide, Piece } from "common/game/types";
import bishopBlack from "/assets/Chess_bdt45.svg";
import bishopWhite from "/assets/Chess_blt45.svg";
import kingBlack from "/assets/Chess_kdt45.svg";
import kingWhite from "/assets/Chess_klt45.svg";
import knightBlack from "/assets/Chess_ndt45.svg";
import knightWhite from "/assets/Chess_nlt45.svg";
import pawnBlack from "/assets/Chess_pdt45.svg";
import pawnWhite from "/assets/Chess_plt45.svg";
import queenBlack from "/assets/Chess_qdt45.svg";
import queenWhite from "/assets/Chess_qlt45.svg";
import rookBlack from "/assets/Chess_rdt45.svg";
import rookWhite from "/assets/Chess_rlt45.svg";

export const assetName = (side: BoardSide, piece: Piece) => side + piece;

export const piecePaths: { [side in BoardSide]: { [piece in Piece]: string } } =
    {
        black: {
            pawn: pawnBlack,
            knight: knightBlack,
            bishop: bishopBlack,
            rook: rookBlack,
            queen: queenBlack,
            king: kingBlack,
        },
        white: {
            pawn: pawnWhite,
            knight: knightWhite,
            bishop: bishopWhite,
            rook: rookWhite,
            queen: queenWhite,
            king: kingWhite,
        },
    };

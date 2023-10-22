import { generateRandomCode } from "utils/random";

export const generateGameId = () => Date.now() + generateRandomCode(4);

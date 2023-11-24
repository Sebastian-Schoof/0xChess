import { generateRandomCode } from "common/utils/random";

export const generateGameId = () => Date.now() + generateRandomCode(4);

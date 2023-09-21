const incrementToChar = (char: any, idx: number) =>
    String.fromCharCode(char + idx);

const randomCodeChars = new Array(10)
    .fill(48)
    .map(incrementToChar)
    .concat(new Array(26).fill(65).map(incrementToChar));

export function generateRandomCode(length: number) {
    const friendCode = new Array(length);
    for (let i = 0; i < length; i++) {
        const randomIdx = Math.floor(Math.random() * randomCodeChars.length);
        friendCode[i] = randomCodeChars[randomIdx];
    }
    return friendCode.join("");
}

const incrementToChar = (char: any, idx: number) =>
    String.fromCharCode(char + idx);
const friendCodeChars = new Array(10)
    .fill(48)
    .map(incrementToChar)
    .concat(new Array(26).fill(65).map(incrementToChar));
export function generateFriendCode(length = 4) {
    const friendCode = new Array(length);
    for (let i = 0; i < length; i++) {
        const randomIdx = Math.floor(Math.random() * friendCodeChars.length);
        friendCode[i] = friendCodeChars[randomIdx];
    }
    return friendCode.join("");
}

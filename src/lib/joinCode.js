const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // avoids confusing chars

export function generateJoinCode(len = 6) {
  let s = "";
  for (let i = 0; i < len; i++) {
    s += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return s;
}

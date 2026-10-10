/// Helpers for the logins the dealer hands out to shop users.

const LETTERS = 'abcdefghjkmnpqrstuvwxyz';
const DIGITS = '23456789';

/// An easy-to-read password, e.g. "kemu4827". No 0/o or 1/l lookalikes.
export function generatePassword() {
  const pick = (set: string, n: number) =>
    Array.from(crypto.getRandomValues(new Uint32Array(n)), (v) => set[v % set.length]).join('');
  return pick(LETTERS, 4) + pick(DIGITS, 4);
}

/// Suggests a username from a shop or person name: "Metro Veg Kaloor" → "metroveg"
export function suggestUsername(name: string) {
  const words = name.toLowerCase().normalize('NFKD').replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(Boolean);
  let out = '';
  for (const w of words) {
    if ((out + w).length > 14 && out.length >= 3) break;
    out += w;
  }
  return out.slice(0, 20);
}

export const USERNAME_RE = /^[a-z0-9._-]{3,30}$/i;
export const PASSWORD_MIN = 6;

export function cleanUsername(v: string) {
  return v.toLowerCase().replace(/[^a-z0-9._-]/g, '');
}

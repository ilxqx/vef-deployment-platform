import { customAlphabet } from "nanoid";

const generator = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 12);
export function generateId() {
  return generator();
}

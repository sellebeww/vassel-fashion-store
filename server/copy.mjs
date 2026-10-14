import { readFileSync } from "node:fs";
const phrases = new Map(
  readFileSync(
    new URL("../src/shop/locales/phrases.tsv", import.meta.url),
    "utf8",
  )
    .trim()
    .split("\n")
    .map((row) => {
      const [key, en] = row.split("\t");
      return [key, en];
    }),
);
export const english = (value) => phrases.get(value) || value;

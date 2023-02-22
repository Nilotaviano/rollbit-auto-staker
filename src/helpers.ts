import { ElementHandle } from "puppeteer";

export function delay(time: number) {
  return new Promise(resolve => setTimeout(resolve, time));
}

export function generateRandom(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min)) + min;
}

export async function typeWithRandomDelay(text: string, inputField: ElementHandle | null, { minDelay, maxDelay }: { minDelay: number; maxDelay: number; } = { minDelay: 25, maxDelay: 55 }) {
  for (const char of text) {
    await delay(generateRandom(minDelay, maxDelay));
    await inputField?.type(char);
  };
}
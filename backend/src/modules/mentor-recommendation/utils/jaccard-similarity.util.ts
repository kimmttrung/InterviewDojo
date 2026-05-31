export function jaccard(source: string[], target: string[]): number {
  const left = new Set(source);

  const right = new Set(target);

  const intersection = [...left].filter((item) => right.has(item)).length;

  const union = new Set([...source, ...target]).size;

  return intersection / union;
}

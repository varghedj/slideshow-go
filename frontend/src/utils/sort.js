// Helper: Natural alphanumeric sort for file paths
export const naturalSortPaths = (paths) => {
  return [...paths].sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
  );
};

// Helper: Fisher-Yates shuffle sequence generator
export const createShuffleSequence = (length, pinOriginalIndex = -1) => {
  const indices = Array.from({ length }, (_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }

  if (length > 0 && pinOriginalIndex >= 0) {
    const foundIdx = indices.indexOf(pinOriginalIndex);
    if (foundIdx !== -1) {
      indices.splice(foundIdx, 1);
      indices.unshift(pinOriginalIndex);
    }
  }
  return indices;
};

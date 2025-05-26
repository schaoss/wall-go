// Utility to convert GameSnapshot to a structured-cloneable object for Web Workers
import type { GameSnapshot } from '../lib/types';

export function toSerializableSnapshot(s: GameSnapshot): object {
  return {
    ...s,
    legal: Array.from(s.legal),
    // Add more conversions if you add more non-serializable fields in the future
  };
}

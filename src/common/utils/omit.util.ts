/**
 * Generic utility function to omit specified keys from an object
 * @param entity - The object to omit keys from
 * @param keysToOmit - Array of keys to omit from the object
 * @returns A new object with the specified keys omitted
 */
export function omit<T, K extends keyof T>(
  entity: T,
  keysToOmit: K[]
): Omit<T, K> {
  const result = { ...entity }
  keysToOmit.forEach(key => {
    delete result[key]
  })
  return result
}

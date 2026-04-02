import { omit } from './omit.util'

describe('omit', () => {
  it('should omit specified keys from an object', () => {
    const obj = { a: 1, b: 2, c: 3 }
    const result = omit(obj, ['b'])
    expect(result).toEqual({ a: 1, c: 3 })
  })

  it('should omit multiple keys', () => {
    const obj = { a: 1, b: 2, c: 3, d: 4 }
    const result = omit(obj, ['b', 'd'])
    expect(result).toEqual({ a: 1, c: 3 })
  })

  it('should return a copy when no keys are omitted', () => {
    const obj = { a: 1, b: 2 }
    const result = omit(obj, [])
    expect(result).toEqual({ a: 1, b: 2 })
    expect(result).not.toBe(obj)
  })

  it('should not modify the original object', () => {
    const obj = { a: 1, b: 2, c: 3 }
    omit(obj, ['b'])
    expect(obj).toEqual({ a: 1, b: 2, c: 3 })
  })
})

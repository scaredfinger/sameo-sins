import { MonadicMap } from "./monadic-map"

describe('MonadicMap', () => {
  let sut: MonadicMap<string, number>

  beforeEach(() => {
    sut = new MonadicMap<string, number>()
  })

  it('can be created', () => {
    expect(sut).toBeTruthy()
  })

  it('returns Optional None when key is not found', () => {
    expect(sut.get('foo').isNone()).toBe(true)
  })

  it('returns Optional Some when key is found', () => {
    sut.set('foo', 42)
    expect(sut.get('foo').isSome()).toBe(true)
  })

  it('can map values', () => {
    sut.set('foo', 42)
    const result = sut.mapValues((v) => v + 1)
    expect(result[0]).toBe(43)
  })
})
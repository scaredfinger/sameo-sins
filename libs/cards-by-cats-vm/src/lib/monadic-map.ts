import { Option } from '@swan-io/boxed'

export class MonadicMap<Key, Value> implements Iterable<[Key, Value]> {
    private readonly pairs: Record<string, Value> = {}
  
    constructor(entries?: Iterable<[Key, Value]>) {
      if (!entries) {
        return
      }
  
      for (const [key, value] of entries) {
        this.pairs[JSON.stringify(key)] = value
      }
    }
  
    [Symbol.iterator](): Iterator<[Key, Value], any, undefined> {
      return Object.entries(this.pairs)
        .map(([key, value]) => [JSON.parse(key), value] as [Key, Value])
        [Symbol.iterator]()
    }
  
    public get(key: Key): Option<Value> {
      const maybeValue = this.pairs[JSON.stringify(key)]
  
      return maybeValue ? Option.Some(maybeValue) : Option.None()
    }
  
    public set(key: Key, value: Value) {
      this.pairs[JSON.stringify(key)] = value
    }
  
    public values(): Value[] {
      return Object.values(this.pairs)
    }
  
    public forEach(callback: (value: Value, key: Key) => void) {
      Object.entries(this.pairs).forEach(([key, value]) => {
        callback(value, JSON.parse(key))
      })
    }
  
    public mapValues<T>(callback: (value: Value, key: Key) => T): T[] {
      return Object.entries(this.pairs).map(([key, value]) =>
        callback(value, JSON.parse(key))
      )
    }
  }
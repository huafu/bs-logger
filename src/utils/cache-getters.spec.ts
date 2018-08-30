import { cacheGetters } from './cache-getters'

describe('cacheGetters', () => {
  it('should replace getters with return value on the first call', () => {
    const obj = cacheGetters(
      {
        callFoo: jest.fn(() => 'bar'),
        get foo() {
          return this.callFoo()
        },
      },
      'foo',
    )
    expect(obj.callFoo).not.toHaveBeenCalled()
    expect(obj.foo).toBe('bar')
    expect(obj.callFoo).toHaveBeenCalledTimes(1)
    expect(Object.getOwnPropertyDescriptor(obj, 'foo')).toMatchInlineSnapshot(`
Object {
  "configurable": true,
  "enumerable": true,
  "value": "bar",
  "writable": false,
}
`)
    expect(obj.foo).toBe('bar')
    expect(obj.foo).toBe('bar')
    expect(obj.callFoo).toHaveBeenCalledTimes(1)
  })
})

/**
 * Redefine object's given property getters so that the property is replaced with the value
 * on the first call
 * @param target The object owning the keys defined as getter and to be cached
 * @param props Property names
 */
const cacheGetters = <T>(target: T, ...props: Array<keyof T>): T => {
  props.forEach(prop => {
    const desc = Object.getOwnPropertyDescriptor(target, prop) as PropertyDescriptor
    const { set, get: previousGet, ...partial } = desc
    desc.get = function get() {
      const value = (previousGet as any).call(this)
      Object.defineProperty(this, prop, { ...partial, value })
      return value
    }
    Object.defineProperty(target, prop, desc)
  })
  return target
}

export { cacheGetters }

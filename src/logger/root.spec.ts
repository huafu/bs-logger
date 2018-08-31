import { rootLogger } from './root'

process.env.LOG_TARGET = ''

describe('rootLogger', () => {
  it('should be a function', () => {
    expect(typeof rootLogger).toBe('function')
    expect(() => rootLogger('hello')).not.toThrow()
  })
})

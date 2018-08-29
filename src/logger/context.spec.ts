import { LogContexts } from './context'

describe('LogContexts', () => {
  it('should export all common keys', () => {
    expect(LogContexts).toEqual({
      application: 'application',
      hostname: 'hostname',
      logLevel: 'logLevel',
      namespace: 'namespace',
      package: 'package',
    })
  })
})

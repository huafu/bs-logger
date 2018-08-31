import { LogFormatters, LogMessageFormatter, registerLogFormatter, resetLogFormatters } from './message'

const time = +new Date('2018-01-01T12:30:40.000Z')

beforeEach(() => {
  resetLogFormatters()
})

describe('LogFormatters', () => {
  describe('json', () => {
    it('should format correctly', () => {
      expect(
        LogFormatters.json({
          context: { package: 'pkg', application: 'app', namespace: 'ns', logLevel: 50 },
          message: 'hello',
          sequence: 1,
          time,
        }),
      ).toMatchInlineSnapshot(
        `"{\\"context\\":{\\"application\\":\\"app\\",\\"logLevel\\":50,\\"namespace\\":\\"ns\\",\\"package\\":\\"pkg\\"},\\"message\\":\\"hello\\",\\"sequence\\":1,\\"time\\":\\"2018-01-01T12:30:40.000Z\\"}"`,
      )
      expect(
        LogFormatters.json({
          context: { package: 'pkg', application: 'app', namespace: 'ns' },
          message: 'hello',
          sequence: 12,
          time,
        }),
      ).toMatchInlineSnapshot(
        `"{\\"context\\":{\\"application\\":\\"app\\",\\"namespace\\":\\"ns\\",\\"package\\":\\"pkg\\"},\\"message\\":\\"hello\\",\\"sequence\\":12,\\"time\\":\\"2018-01-01T12:30:40.000Z\\"}"`,
      )
      expect(
        LogFormatters.json({
          context: { package: 'pkg', application: 'app' },
          message: 'hello',
          sequence: 12,
          time,
        }),
      ).toMatchInlineSnapshot(
        `"{\\"context\\":{\\"application\\":\\"app\\",\\"package\\":\\"pkg\\"},\\"message\\":\\"hello\\",\\"sequence\\":12,\\"time\\":\\"2018-01-01T12:30:40.000Z\\"}"`,
      )
      expect(
        LogFormatters.json({
          context: { application: 'app' },
          message: 'hello',
          sequence: 12,
          time,
        }),
      ).toMatchInlineSnapshot(
        `"{\\"context\\":{\\"application\\":\\"app\\"},\\"message\\":\\"hello\\",\\"sequence\\":12,\\"time\\":\\"2018-01-01T12:30:40.000Z\\"}"`,
      )
      expect(
        LogFormatters.json({
          context: {},
          message: 'hello',
          sequence: 12,
          time,
        }),
      ).toMatchInlineSnapshot(
        `"{\\"context\\":{},\\"message\\":\\"hello\\",\\"sequence\\":12,\\"time\\":\\"2018-01-01T12:30:40.000Z\\"}"`,
      )
    })
    it('should allow circular references', () => {
      const obj: any = { foo: 'bar' }
      obj.circularRef = obj
      expect(
        LogFormatters.json({
          context: { one: 1, withCircular: obj },
          message: 'hello',
          sequence: 12,
          time,
        }),
      ).toMatchInlineSnapshot(
        `"{\\"context\\":{\\"one\\":1,\\"withCircular\\":{\\"circularRef\\":\\"__cycle__\\",\\"foo\\":\\"bar\\"}},\\"message\\":\\"hello\\",\\"sequence\\":12,\\"time\\":\\"2018-01-01T12:30:40.000Z\\"}"`,
      )
    })
  })
  describe('simple', () => {
    it('should format correctly', () => {
      expect(
        LogFormatters.simple({
          context: { package: 'pkg', application: 'app', namespace: 'ns', logLevel: 50 },
          message: 'hello',
          sequence: 1,
          time,
        }),
      ).toMatchInlineSnapshot(`"pkg[ns] (ERROR) hello"`)
      expect(
        LogFormatters.simple({
          context: { package: 'pkg', application: 'app', namespace: 'ns' },
          message: 'hello',
          sequence: 1,
          time,
        }),
      ).toMatchInlineSnapshot(`"pkg[ns] (TRACE) hello"`)
      expect(
        LogFormatters.simple({
          context: { package: 'pkg', application: 'app' },
          message: 'hello',
          sequence: 12,
          time,
        }),
      ).toMatchInlineSnapshot(`"pkg[root] (TRACE) hello"`)
      expect(
        LogFormatters.simple({
          context: { application: 'app' },
          message: 'hello',
          sequence: 12,
          time,
        }),
      ).toMatchInlineSnapshot(`"app[root] (TRACE) hello"`)
      expect(
        LogFormatters.simple({
          context: {},
          message: 'hello',
          sequence: 12,
          time,
        }),
      ).toMatchInlineSnapshot(`"main[root] (TRACE) hello"`)
    })
  })
})

describe('registerLogFormatter', () => {
  it('should be possible to register a custom formatter', () => {
    const fooFormatter: LogMessageFormatter = m => m.message
    registerLogFormatter('foo', fooFormatter)
    expect(LogFormatters.foo).toBe(fooFormatter)
  })
})

describe('resetLogFormatter', () => {
  it('should be possible to reset log formatters to defaults', () => {
    const fooFormatter: LogMessageFormatter = m => m.message
    registerLogFormatter('json', fooFormatter)
    expect(LogFormatters.json).toBe(fooFormatter)
    resetLogFormatters()
    expect(LogFormatters.json).not.toBe(fooFormatter)
  })
})

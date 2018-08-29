import { LogFormatters } from './message'

const time = +new Date('2018-01-01T12:30:40.000Z')

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
  })
  describe('prefixedMessage', () => {
    it('should format correctly', () => {
      expect(
        LogFormatters.prefixedMessage({
          context: { package: 'pkg', application: 'app', namespace: 'ns', logLevel: 50 },
          message: 'hello',
          sequence: 1,
          time,
        }),
      ).toMatchInlineSnapshot(`"pkg[ns] (ERROR) hello"`)
      expect(
        LogFormatters.prefixedMessage({
          context: { package: 'pkg', application: 'app', namespace: 'ns' },
          message: 'hello',
          sequence: 1,
          time,
        }),
      ).toMatchInlineSnapshot(`"pkg[ns] (TRACE) hello"`)
      expect(
        LogFormatters.prefixedMessage({
          context: { package: 'pkg', application: 'app' },
          message: 'hello',
          sequence: 12,
          time,
        }),
      ).toMatchInlineSnapshot(`"pkg[root] (TRACE) hello"`)
      expect(
        LogFormatters.prefixedMessage({
          context: { application: 'app' },
          message: 'hello',
          sequence: 12,
          time,
        }),
      ).toMatchInlineSnapshot(`"app[root] (TRACE) hello"`)
      expect(
        LogFormatters.prefixedMessage({
          context: {},
          message: 'hello',
          sequence: 12,
          time,
        }),
      ).toMatchInlineSnapshot(`"main[root] (TRACE) hello"`)
    })
  })
})

import * as bsl from '.'

process.env.LOG_TARGETS = 'stdout:0'

describe('bs-logger', () => {
  it('should export required helpers', () => {
    expect(Object.keys(bsl)).toMatchInlineSnapshot(`
Array [
  "createLogger",
  "lastSequenceNumber",
  "resetSequence",
  "LogContexts",
  "LogLevels",
  "logLevelNameFor",
  "parseLogLevel",
  "registerLogFormatter",
  "resetLogFormatters",
  "default",
  "logger",
  "setup",
  "DEFAULT_LOG_TARGET",
  "parseLogTargets",
  "testing",
]
`)
  })

  it('should not create any logger until default logger is used', () => {
    const factory = jest.fn(() => () => () => void 0)
    bsl.setup(factory)
    expect(factory).not.toHaveBeenCalled()
    bsl.default('hello')
    expect(factory).toHaveBeenCalledTimes(1)
  })
})

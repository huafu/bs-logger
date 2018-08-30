import { createWriteStream as _createWriteStream } from 'fs'
import { resolve } from 'path'

import { LogLevels } from './level'
import { LogFormatters, LogMessageFormatter, registerLogFormatter } from './message'
import { DEFAULT_LOG_TARGET, parseLogTargets } from './target'

const createWriteStream = _createWriteStream as jest.Mock<typeof _createWriteStream>
const cwd = process.cwd()

jest.mock('fs', () => ({
  createWriteStream: jest.fn((path: any, options: any) => ({ path, options })),
}))

beforeEach(() => {
  createWriteStream.mockClear()
})

describe('DEFAULT_LOG_TARGET', () => {
  it('should represent a target logging warnings and above to standard error', () => {
    expect(DEFAULT_LOG_TARGET).toBe(['stderr', LogLevels.warn].join(':'))
  })
})

describe('parseLogTargets', () => {
  const sr = (path: string, append?: boolean) => ({
    path: resolve(cwd, path),
    options: { flags: append ? 'a' : 'w', encoding: 'utf8', autoClose: true },
  })
  it('should always return an array', () => {
    expect(Array.isArray(parseLogTargets())).toBe(true)
    expect(Array.isArray(parseLogTargets(undefined))).toBe(true)
    expect(Array.isArray(parseLogTargets('a'))).toBe(true)
  })
  it('should parse a file path', () => {
    const targets = parseLogTargets('file.log')
    expect(targets).toHaveLength(1)
    expect(targets[0].format).toBe(LogFormatters.json)
    expect(targets[0].minLevel).toBe(-Infinity)
    expect(targets[0].stream).toEqual(sr('file.log'))
  })
  it('should parse a file path and use append mode', () => {
    const targets = parseLogTargets('file.log+')
    expect(targets).toHaveLength(1)
    expect(targets[0].format).toBe(LogFormatters.json)
    expect(targets[0].minLevel).toBe(-Infinity)
    expect(targets[0].stream).toEqual(sr('file.log', true))
  })
  it('should parse a file path with comma', () => {
    const targets = parseLogTargets('fi\\,le.log')
    expect(targets).toHaveLength(1)
    expect(targets[0].format).toBe(LogFormatters.json)
    expect(targets[0].minLevel).toBe(-Infinity)
    expect(targets[0].stream).toEqual(sr('fi,le.log'))
  })
  it('should parse a file path with log level value', () => {
    const targets = parseLogTargets(`file.log:${LogLevels.error}`)
    expect(targets).toHaveLength(1)
    expect(targets[0].format).toBe(LogFormatters.json)
    expect(targets[0].minLevel).toBe(LogLevels.error)
    expect(targets[0].stream).toEqual(sr('file.log'))
  })
  it('should parse a file path with log level name', () => {
    const targets = parseLogTargets(`file.log:debug`)
    expect(targets).toHaveLength(1)
    expect(targets[0].format).toBe(LogFormatters.json)
    expect(targets[0].minLevel).toBe(LogLevels.debug)
    expect(targets[0].stream).toEqual(sr('file.log'))
  })
  it('should parse stderr', () => {
    let targets = parseLogTargets('stderr')
    expect(targets).toHaveLength(1)
    expect(targets[0].format).toBe(LogFormatters.simple)
    expect(targets[0].minLevel).toBe(-Infinity)
    expect(targets[0].stream).toBe(process.stderr)

    targets = parseLogTargets('STDERR')
    expect(targets).toHaveLength(1)
    expect(targets[0].format).toBe(LogFormatters.simple)
    expect(targets[0].minLevel).toBe(-Infinity)
    expect(targets[0].stream).toBe(process.stderr)
  })
  it('should parse stdout', () => {
    let targets = parseLogTargets('stdout')
    expect(targets).toHaveLength(1)
    expect(targets[0].format).toBe(LogFormatters.simple)
    expect(targets[0].minLevel).toBe(-Infinity)
    expect(targets[0].stream).toBe(process.stdout)

    targets = parseLogTargets('STDOUT')
    expect(targets).toHaveLength(1)
    expect(targets[0].format).toBe(LogFormatters.simple)
    expect(targets[0].minLevel).toBe(-Infinity)
    expect(targets[0].stream).toBe(process.stdout)
  })
  it('should not create the stream before accessing the prop', () => {
    const targets = parseLogTargets('file.log')
    expect(createWriteStream).not.toHaveBeenCalled()
    expect(targets[0].stream).toBeDefined()
    expect(createWriteStream).toHaveBeenCalledTimes(1)
  })
  it('should read the format after `%`', () => {
    let targets = parseLogTargets('file.log%simple')
    expect(targets).toHaveLength(1)
    expect(targets[0].format).toBe(LogFormatters.simple)
    targets = parseLogTargets('stdout%json')
    expect(targets).toHaveLength(1)
    expect(targets[0].format).toBe(LogFormatters.json)
  })
  it('should fallback to the default formatter if the specified one does not exist', () => {
    let targets = parseLogTargets('file.log%foo')
    expect(targets).toHaveLength(1)
    expect(targets[0].format).toBe(LogFormatters.json)
    targets = parseLogTargets('stdout%bar')
    expect(targets).toHaveLength(1)
    expect(targets[0].format).toBe(LogFormatters.simple)
  })
  it('should be possible to use custom formatters', () => {
    const fooFormatter: LogMessageFormatter = m => m.message
    registerLogFormatter('foo', fooFormatter)
    const targets = parseLogTargets('file.log%foo')
    expect(targets).toHaveLength(1)
    expect(targets[0].format).toBe(fooFormatter)
  })
  it('should read multiple targets', () => {
    const targets = parseLogTargets('all.log, stdout:info%json, stderr:55 ,append.log+:warn%simple')
    expect(targets).toHaveLength(4)
    // formatter
    expect(targets[0].format).toBe(LogFormatters.json)
    expect(targets[1].format).toBe(LogFormatters.json)
    expect(targets[2].format).toBe(LogFormatters.simple)
    expect(targets[3].format).toBe(LogFormatters.simple)
    // minLevel
    expect(targets[0].minLevel).toBe(-Infinity)
    expect(targets[1].minLevel).toBe(LogLevels.info)
    expect(targets[2].minLevel).toBe(55)
    expect(targets[3].minLevel).toBe(LogLevels.warn)
    // streams
    expect(targets[0].stream).toEqual(sr('all.log'))
    expect(targets[1].stream).toBe(process.stdout)
    expect(targets[2].stream).toBe(process.stderr)
    expect(targets[3].stream).toEqual(sr('append.log', true))
  })
})

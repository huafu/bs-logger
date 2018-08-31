import { LogContexts } from '../logger/context'
import { LogLevelNames, LogLevels } from '../logger/level'
import { LogMessage } from '../logger/message'

import { ExtendedArray, LogTargetMock, extendArray } from './target-mock'

const time = +new Date('2018-01-01T12:30:40.000Z')
const sequence = 1

const fakeMessage = (level?: number | undefined, message = 'foo'): LogMessage => {
  const context: any = {}
  if (level != null) {
    context[LogContexts.logLevel] = level
  }
  return { context, message, time, sequence }
}

describe('extendArray', () => {
  let array: ExtendedArray<any>
  beforeEach(() => {
    array = extendArray([])
  })
  describe('last', () => {
    it('should be undefined if the array is empty', () => {
      expect(array.last).toBeUndefined()
    })
    it('should follow the last item in the array', () => {
      array.push(10)
      expect(array.last).toBe(10)
      const dummy = {}
      array.push('a', {}, 20, dummy, {})
      expect(array.last).not.toBe(dummy)
      array.pop()
      expect(array.last).toBe(dummy)
      array.splice(0, array.length)
      expect(array.last).toBeUndefined()
    })
  })
})

describe('LogTargetMock', () => {
  it('should create instances with empty arrays', () => {
    const tm = new LogTargetMock()
    expect(tm).toBeInstanceOf(LogTargetMock)
    expect(Array.isArray(tm.messages)).toBe(true)
    expect(tm.messages).toHaveLength(0)
    expect(Array.isArray(tm.messages.trace)).toBe(true)
    expect(tm.messages.trace).toHaveLength(0)
    expect(Array.isArray(tm.messages.debug)).toBe(true)
    expect(tm.messages.debug).toHaveLength(0)
    expect(Array.isArray(tm.messages.info)).toBe(true)
    expect(tm.messages.info).toHaveLength(0)
    expect(Array.isArray(tm.messages.warn)).toBe(true)
    expect(tm.messages.warn).toHaveLength(0)
    expect(Array.isArray(tm.messages.error)).toBe(true)
    expect(tm.messages.error).toHaveLength(0)
    expect(Array.isArray(tm.messages.fatal)).toBe(true)
    expect(tm.messages.fatal).toHaveLength(0)
    expect(Array.isArray(tm.lines)).toBe(true)
    expect(tm.lines).toHaveLength(0)
    expect(Array.isArray(tm.lines.trace)).toBe(true)
    expect(tm.lines.trace).toHaveLength(0)
    expect(Array.isArray(tm.lines.debug)).toBe(true)
    expect(tm.lines.debug).toHaveLength(0)
    expect(Array.isArray(tm.lines.info)).toBe(true)
    expect(tm.lines.info).toHaveLength(0)
    expect(Array.isArray(tm.lines.warn)).toBe(true)
    expect(tm.lines.warn).toHaveLength(0)
    expect(Array.isArray(tm.lines.error)).toBe(true)
    expect(tm.lines.error).toHaveLength(0)
    expect(Array.isArray(tm.lines.fatal)).toBe(true)
    expect(tm.lines.fatal).toHaveLength(0)
  })

  it('should format messages correctly', () => {
    const tm = new LogTargetMock()
    expect(tm.format(fakeMessage())).toBe('foo')
    expect(tm.format(fakeMessage(10))).toBe('[level:10] foo')
    expect(tm.format(fakeMessage(Infinity))).toBe('[level:Infinity] foo')
    expect(tm.format(fakeMessage(-100))).toBe('[level:-100] foo')
    expect(tm.format(fakeMessage(-Infinity))).toBe('[level:-Infinity] foo')
  })

  it('should filter messages correctly', () => {
    const tm = new LogTargetMock()
    tm.format(fakeMessage())
    expect(tm.messages).toHaveLength(1)
    LogLevelNames.forEach(n => {
      expect(tm.messages[n]).toHaveLength(0)
    })

    tm.clear()
    tm.format(fakeMessage(LogLevels.info))
    expect(tm.messages).toHaveLength(1)
    LogLevelNames.forEach(n => {
      expect(tm.messages[n]).toHaveLength(n === 'info' ? 1 : 0)
    })

    tm.clear()
    tm.format(fakeMessage())
    tm.format(fakeMessage(LogLevels.debug))
    tm.format(fakeMessage(LogLevels.error))
    tm.format(fakeMessage(LogLevels.fatal))
    expect(tm.filteredMessages(null)).toMatchInlineSnapshot(`
Array [
  Object {
    "context": Object {},
    "message": "foo",
    "sequence": 1,
    "time": 1514809840000,
  },
]
`)
    expect(tm.filteredMessages(LogLevels.error, Infinity)).toMatchInlineSnapshot(`
Array [
  Object {
    "context": Object {
      "logLevel": 50,
    },
    "message": "foo",
    "sequence": 1,
    "time": 1514809840000,
  },
  Object {
    "context": Object {
      "logLevel": 60,
    },
    "message": "foo",
    "sequence": 1,
    "time": 1514809840000,
  },
]
`)
    expect(tm.filteredMessages(LogLevels.debug, LogLevels.info)).toMatchInlineSnapshot(`
Array [
  Object {
    "context": Object {
      "logLevel": 20,
    },
    "message": "foo",
    "sequence": 1,
    "time": 1514809840000,
  },
]
`)
  })

  it('should filter lines correctly', () => {
    const tm = new LogTargetMock()
    tm.stream.write(tm.format(fakeMessage()))
    expect(tm.lines).toHaveLength(1)
    LogLevelNames.forEach(n => {
      expect(tm.lines[n]).toHaveLength(0)
    })

    tm.clear()
    tm.stream.write(tm.format(fakeMessage(LogLevels.warn)))
    expect(tm.lines).toHaveLength(1)
    LogLevelNames.forEach(n => {
      expect(tm.lines[n]).toHaveLength(n === 'warn' ? 1 : 0)
    })

    tm.clear()
    tm.stream.write(tm.format(fakeMessage()))
    tm.stream.write(tm.format(fakeMessage(LogLevels.debug)))
    tm.stream.write(tm.format(fakeMessage(LogLevels.error)))
    tm.stream.write(tm.format(fakeMessage(LogLevels.fatal)))
    expect(tm.filteredLines(null)).toMatchInlineSnapshot(`
Array [
  "foo",
]
`)
    expect(tm.filteredLines(LogLevels.error, Infinity)).toMatchInlineSnapshot(`
Array [
  "[level:50] foo",
  "[level:60] foo",
]
`)
    expect(tm.filteredLines(LogLevels.debug, LogLevels.info)).toMatchInlineSnapshot(`
Array [
  "[level:20] foo",
]
`)
  })
})

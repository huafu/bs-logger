import { LogTargetMock } from '../testing/target-mock'

import { LogMethod, Logger, createLogger, resetSequence } from '.'
import { LogContexts } from './context'
import { LogMessage } from './message'

const timeOrigin = +new Date('2018-01-01T00:00:00.000Z')
let timeIncrement = 0
const dateNowSpy = jest.spyOn(Date, 'now')
const levelNames = ['trace', 'debug', 'info', 'warn', 'error', 'fatal']

beforeEach(() => {
  resetSequence()
  timeIncrement = 0
  dateNowSpy.mockReset()
  dateNowSpy.mockImplementation(() => timeOrigin + timeIncrement++ * 1000 * 60 * 60 * 24)
})

describe('createLogger', () => {
  let target: LogTargetMock
  let logger: Logger
  let nonMatchingTarget: LogTargetMock
  let loggerWithoutTarget: Logger
  let loggerWithNonMatchingTarget: Logger

  beforeEach(() => {
    target = new LogTargetMock()
    logger = createLogger({ context: { package: 'pkg' }, targets: [target] })
    nonMatchingTarget = new LogTargetMock(Infinity)
    loggerWithoutTarget = createLogger({ targets: [] })
    loggerWithNonMatchingTarget = createLogger({ targets: [nonMatchingTarget] })
  })

  it('should create empty function when no target', () => {
    expect(loggerWithoutTarget.isEmptyFunction).toBe(true)
  })

  it('should not log when no matching target', () => {
    expect(loggerWithNonMatchingTarget.isEmptyFunction).not.toBeDefined()
    loggerWithNonMatchingTarget({ [LogContexts.logLevel]: 0 }, 'hi!')
    expect(nonMatchingTarget.messages).toHaveLength(0)
    expect(nonMatchingTarget.lines).toHaveLength(0)
  })

  it('should log without context', () => {
    logger('hello')
    expect(target.messages.last).toMatchInlineSnapshot(`
Object {
  "context": Object {
    "package": "pkg",
  },
  "message": "hello",
  "sequence": 1,
  "time": 1514764800000,
}
`)
    expect(target.lines.last).toMatchInlineSnapshot(`
"hello
"
`)
    logger('hello', 'motto')
    expect(target.messages.last).toMatchInlineSnapshot(`
Object {
  "context": Object {
    "package": "pkg",
  },
  "message": "hello motto",
  "sequence": 2,
  "time": 1514851200000,
}
`)
    expect(target.lines.last).toMatchInlineSnapshot(`
"hello motto
"
`)
  })

  it('should log with context', () => {
    logger({ foo: 'bar' }, 'hello')
    expect(target.messages.last).toMatchInlineSnapshot(`
Object {
  "context": Object {
    "foo": "bar",
    "package": "pkg",
  },
  "message": "hello",
  "sequence": 1,
  "time": 1514764800000,
}
`)
    expect(target.lines.last).toMatchInlineSnapshot(`
"hello
"
`)
    logger({ package: 'foo', foo: 'bar', [LogContexts.logLevel]: -1000 }, 'hello')
    expect(target.messages.last).toMatchInlineSnapshot(`
Object {
  "context": Object {
    "foo": "bar",
    "logLevel": -1000,
    "package": "foo",
  },
  "message": "hello",
  "sequence": 2,
  "time": 1514851200000,
}
`)
    expect(target.lines.last).toMatchInlineSnapshot(`
"[level:-1000] hello
"
`)
  })

  describe('logTranslator', () => {
    const tr1 = jest.fn((m: LogMessage) => {
      m.message = `tr1: ${m.message}`
      m.context.foo = 'bar'
      return m
    })
    const tr2 = jest.fn((m: LogMessage) => {
      m.message = `tr2: ${m.message}`
      m.context.bar = 'foo'
      return m
    })
    let loggerWithTr: Logger
    beforeEach(() => {
      tr1.mockClear()
      tr2.mockClear()
      loggerWithTr = createLogger({ targets: [target], translate: tr1 })
    })
    it('should use given translator', () => {
      loggerWithTr('woot!')
      expect(tr1).toHaveBeenCalledTimes(1)
      expect(target.messages.last).toMatchInlineSnapshot(`
Object {
  "context": Object {
    "foo": "bar",
  },
  "message": "tr1: woot!",
  "sequence": 1,
  "time": 1514764800000,
}
`)
      expect(target.lines.last).toMatchInlineSnapshot(`
"tr1: woot!
"
`)
    })
    it('should re-use child translator', () => {
      loggerWithTr.child({ childNoTr: true })('hello')
      expect(tr1).toHaveBeenCalledTimes(1)
      expect(tr2).toHaveBeenCalledTimes(0)
      expect(target.messages.last).toMatchInlineSnapshot(`
Object {
  "context": Object {
    "childNoTr": true,
    "foo": "bar",
  },
  "message": "tr1: hello",
  "sequence": 1,
  "time": 1514764800000,
}
`)
      expect(target.lines.last).toMatchInlineSnapshot(`
"tr1: hello
"
`)
      loggerWithTr.child(tr2)('bye')
      expect(tr1).toHaveBeenCalledTimes(2)
      expect(tr2).toHaveBeenCalledTimes(1)
      expect(target.messages.last).toMatchInlineSnapshot(`
Object {
  "context": Object {
    "bar": "foo",
    "foo": "bar",
  },
  "message": "tr2: tr1: bye",
  "sequence": 2,
  "time": 1514851200000,
}
`)
      expect(target.lines.last).toMatchInlineSnapshot(`
"tr2: tr1: bye
"
`)
    })
  })

  levelNames.forEach(levelName => {
    const logMethods = {
      get base() {
        return (logger as any)[levelName] as LogMethod
      },
      get noTarget() {
        return (loggerWithoutTarget as any)[levelName] as LogMethod
      },
      get nonMatchingTarget() {
        return (loggerWithNonMatchingTarget as any)[levelName] as LogMethod
      },
    }
    describe(`${levelName}()`, () => {
      it(`should log without context`, () => {
        logMethods.base('hi!')
        expect(target.messages.last).toMatchSnapshot('target.format')
        expect(target.lines.last).toMatchSnapshot('target.stream.write')
      })
      it(`should log with context`, () => {
        // -1000 should not appear in snapshots
        logMethods.base({ foo: 'bar', [LogContexts.logLevel]: -1000 }, 'hi!')
        expect(target.messages.last).toMatchSnapshot('target.format')
        expect(target.lines.last).toMatchSnapshot('target.stream.write')
      })
      it('should not log anything with no targets or none matching', () => {
        expect(logMethods.noTarget.isEmptyFunction).toBe(true)
        expect(logMethods.nonMatchingTarget.isEmptyFunction).not.toBeDefined()
        logMethods.nonMatchingTarget('foo')
        expect(nonMatchingTarget.messages).toHaveLength(0)
        expect(nonMatchingTarget.lines).toHaveLength(0)
        // should have been replaced with empty func
        expect(logMethods.nonMatchingTarget.isEmptyFunction).toBe(true)
      })
    })
  }) // for each level

  describe('child()', () => {
    it('should return an empty logger when no target', () => {
      const child = loggerWithoutTarget.child({})
      expect(child.isEmptyFunction).toBe(true)
      levelNames.forEach(name => {
        expect((child as any)[name]).toBe(child)
      })
      expect(child.child({}).isEmptyFunction).toBe(true)
      const f = () => 'hello'
      expect(child.wrap(f)).toBe(f)
      expect(child.wrap('hello', f)).toBe(f)
      expect(child.wrap({}, 'hello', f)).toBe(f)
    })

    it('should extend the context', () => {
      const child = logger.child({ child: 'foo', [LogContexts.logLevel]: 555 })
      child('msg')
      expect(target.messages.last).toMatchInlineSnapshot(`
Object {
  "context": Object {
    "child": "foo",
    "logLevel": 555,
    "package": "pkg",
  },
  "message": "msg",
  "sequence": 1,
  "time": 1514764800000,
}
`)
      expect(target.lines.last).toMatchInlineSnapshot(`
"[level:555] msg
"
`)
      child({ [LogContexts.logLevel]: -10 }, 'hi!')
      expect(target.messages.last).toMatchInlineSnapshot(`
Object {
  "context": Object {
    "child": "foo",
    "logLevel": -10,
    "package": "pkg",
  },
  "message": "hi!",
  "sequence": 2,
  "time": 1514851200000,
}
`)
      expect(target.lines.last).toMatchInlineSnapshot(`
"[level:-10] hi!
"
`)
    })
  })

  describe('wrap', () => {
    function toWrap(a: string) {
      return `bar ${a}`
    }
    it('should wrap a function', () => {
      const f1 = logger.wrap(toWrap)
      expect(f1('foo')).toBe('bar foo')
      expect(target.messages.last).toMatchInlineSnapshot(`
Object {
  "context": Object {
    "call": Object {
      "args": Array [
        "foo",
      ],
    },
    "package": "pkg",
  },
  "message": "calling toWrap()",
  "sequence": 1,
  "time": 1514764800000,
}
`)
      expect(target.lines.last).toMatchInlineSnapshot(`
"calling toWrap()
"
`)
      const f2 = logger.wrap('custom msg', toWrap)
      expect(f2('foo')).toBe('bar foo')
      expect(target.messages.last).toMatchInlineSnapshot(`
Object {
  "context": Object {
    "call": Object {
      "args": Array [
        "foo",
      ],
    },
    "package": "pkg",
  },
  "message": "custom msg",
  "sequence": 2,
  "time": 1514851200000,
}
`)
      expect(target.lines.last).toMatchInlineSnapshot(`
"custom msg
"
`)
      const f3 = logger.wrap({ foo: 'bar' }, 'custom msg', toWrap)
      expect(f3('foo')).toBe('bar foo')
      expect(target.messages.last).toMatchInlineSnapshot(`
Object {
  "context": Object {
    "call": Object {
      "args": Array [
        "foo",
      ],
    },
    "foo": "bar",
    "package": "pkg",
  },
  "message": "custom msg",
  "sequence": 3,
  "time": 1514937600000,
}
`)
      expect(target.lines.last).toMatchInlineSnapshot(`
"custom msg
"
`)
    })

    it('should not wrap when no target or non matching', () => {
      expect(loggerWithoutTarget.wrap(toWrap)).toBe(toWrap)
      expect(loggerWithNonMatchingTarget.wrap(toWrap)).not.toBe(toWrap)
      expect(loggerWithNonMatchingTarget.wrap({ [LogContexts.logLevel]: 0 }, 'foo', toWrap)).toBe(toWrap)
    })

    it('should have correct message for anonymous functions', () => {
      logger.wrap(() => 'foo')()
      expect(target.messages.last).toMatchInlineSnapshot(`
Object {
  "context": Object {
    "call": Object {
      "args": Array [],
    },
    "package": "pkg",
  },
  "message": "calling [anonymous]()",
  "sequence": 1,
  "time": 1514764800000,
}
`)
      expect(target.lines.last).toMatchInlineSnapshot(`
"calling [anonymous]()
"
`)
    })
  })
})

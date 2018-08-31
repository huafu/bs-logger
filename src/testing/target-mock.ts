import { LogContexts } from '../logger/context'
import { LogLevels } from '../logger/level'
import { LogMessage } from '../logger/message'
import { LogTarget } from '../logger/target'

interface ExtendedArray<T> extends Array<T> {
  readonly last: T | undefined
}
interface LogLevelMap<T> {
  trace: T
  debug: T
  info: T
  warn: T
  error: T
  fatal: T
}
const extendArray = <T>(array: T[]): ExtendedArray<T> => {
  return Object.defineProperty(array, 'last', {
    configurable: true,
    get() {
      return this[this.length - 1]
    },
  })
}

class LogTargetMock implements LogTarget {
  readonly messages: ExtendedArray<LogMessage> & LogLevelMap<ExtendedArray<LogMessage>>
  readonly lines: ExtendedArray<string> & LogLevelMap<ExtendedArray<string>>
  readonly stream: LogTarget['stream']

  constructor(public minLevel = -Infinity) {
    this.messages = Object.defineProperties(extendArray([] as LogMessage[]), {
      trace: { get: () => this.filteredMessages(LogLevels.trace) },
      debug: { get: () => this.filteredMessages(LogLevels.debug) },
      info: { get: () => this.filteredMessages(LogLevels.info) },
      warn: { get: () => this.filteredMessages(LogLevels.warn) },
      error: { get: () => this.filteredMessages(LogLevels.error) },
      fatal: { get: () => this.filteredMessages(LogLevels.fatal) },
    })
    this.lines = Object.defineProperties(extendArray([] as string[]), {
      trace: { get: () => this.filteredLines(LogLevels.trace) },
      debug: { get: () => this.filteredLines(LogLevels.debug) },
      info: { get: () => this.filteredLines(LogLevels.info) },
      warn: { get: () => this.filteredLines(LogLevels.warn) },
      error: { get: () => this.filteredLines(LogLevels.error) },
      fatal: { get: () => this.filteredLines(LogLevels.fatal) },
    })
    this.stream = {
      write: (msg: string) => !!this.lines.push(msg),
    } as LogTarget['stream']
  }

  format(msg: LogMessage): string {
    this.messages.push(msg)
    const lvl = msg.context[LogContexts.logLevel]
    if (lvl != null) {
      return `[level:${lvl}] ${msg.message}`
    }
    return msg.message
  }

  clear() {
    this.messages.splice(0, this.messages.length)
    this.lines.splice(0, this.lines.length)
  }

  filteredMessages(level: number, untilLevel?: number): ExtendedArray<LogMessage>
  filteredMessages(level: null): ExtendedArray<LogMessage>
  filteredMessages(level: number | null, untilLevel?: number): ExtendedArray<LogMessage> {
    let filter: (m: LogMessage) => boolean
    if (level == null) {
      filter = (m: LogMessage) => m.context[LogContexts.logLevel] == null
    } else if (untilLevel != null) {
      filter = (m: LogMessage) => {
        const lvl = m.context[LogContexts.logLevel]
        return lvl != null && lvl >= level && lvl <= untilLevel
      }
    } else {
      filter = (m: LogMessage) => m.context[LogContexts.logLevel] === level
    }
    return extendArray(this.messages.filter(filter))
  }

  filteredLines(level: number, untilLevel?: number): ExtendedArray<string>
  filteredLines(level: null): ExtendedArray<string>
  filteredLines(level: number | null, untilLevel?: number): ExtendedArray<string> {
    const extractLevel = (line: string) => {
      const level = (line.match(/^\[level:([0-9]+)\] /) || [])[1]
      return level == null ? undefined : parseInt(level, 10)
    }
    let filter: (l: string) => boolean
    if (level == null) {
      filter = (line: string) => extractLevel(line) === undefined
    } else if (untilLevel != null) {
      filter = (line: string) => {
        const lvl = extractLevel(line)
        return lvl != null && lvl >= level && lvl <= untilLevel
      }
    } else {
      filter = (line: string) => extractLevel(line) === level
    }
    return extendArray(this.lines.filter(filter))
  }
}

export { LogTargetMock, extendArray, ExtendedArray }

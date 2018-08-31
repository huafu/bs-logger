import { format } from 'util'

import { LogContext, LogContexts } from './context'
import { LogLevelNames, LogLevels } from './level'
import { LogMessage, LogMessageTranslator } from './message'
import { DEFAULT_LOG_TARGET, LogTarget, parseLogTargets } from './target'

interface LogMethod {
  (message: string, ...args: any[]): void
  (context: LogContext, message: string, ...args: any[]): void
  isEmptyFunction?: boolean
}
interface LogChildMethod {
  (context: LogContext): Logger
  // tslint:disable-next-line:unified-signatures
  (translate: LogMessageTranslator): Logger
}
interface LogWrapMethod {
  <F extends (...args: any[]) => any>(func: F): F
  <F extends (...args: any[]) => any>(message: string, func: F): F
  <F extends (...args: any[]) => any>(context: LogContext, message: string, func: F): F
  // tslint:disable-next-line:unified-signatures
  <F extends (...args: any[]) => any>(level: number, message: string, func: F): F
}

interface Logger extends LogMethod {
  // quick level helpers
  trace: LogMethod
  debug: LogMethod
  info: LogMethod
  warn: LogMethod
  error: LogMethod
  fatal: LogMethod
  // utilities
  child: LogChildMethod
  wrap: LogWrapMethod
}

let lastSeqNumber = 0
const resetSequence = (next = 1) => {
  lastSeqNumber = next - 1
}
const lastSequenceNumber = () => lastSeqNumber

const createEmptyFunction = (): ((...args: any[]) => any) => {
  // tslint:disable-next-line:no-empty
  return Object.defineProperty(function emptyFunction() {}, 'isEmptyFunction', { value: true })
}

const createEmptyLogger = (): Logger => {
  const log: any = createEmptyFunction()
  log.child = () => createEmptyLogger()
  log.wrap = (...args: any[]) => args.pop()
  LogLevelNames.forEach(name => {
    log[name] = log
  })
  return log
}

interface CreateLoggerOptions {
  context?: LogContext
  translate?: LogMessageTranslator
  targets?: string | LogTarget[]
}

const createLogger = ({
  context: baseContext = {},
  targets: logTargets = DEFAULT_LOG_TARGET,
  translate: logTranslator,
}: CreateLoggerOptions = {}): Logger => {
  const targets = typeof logTargets === 'string' ? parseLogTargets(logTargets) : logTargets
  if (targets.length === 0) {
    return createEmptyLogger()
  }
  const log: any = (...args: any[]) => {
    const time = Date.now()
    const sequence = ++lastSeqNumber
    let context: LogContext
    if (typeof args[0] === 'string') {
      context = { ...baseContext }
    } else {
      context = { ...baseContext, ...args.shift() }
    }
    const msg: string = args.shift()
    const logLevel = context[LogContexts.logLevel]
    // if no log level, do not filter targets
    const destTargets = logLevel == null ? targets : targets.filter(t => logLevel >= t.minLevel)
    if (destTargets.length === 0) {
      return
    }

    const message = format(msg, ...args)
    let logMessage: LogMessage = {
      context,
      time,
      sequence,
      message,
    }
    if (logTranslator) {
      logMessage = logTranslator(logMessage)
    }
    destTargets.forEach(t => t.stream.write(`${t.format(logMessage)}\n`))
  }

  // creates the child helper
  log.child = (ctxOrTranslator: LogContext | LogMessageTranslator) => {
    const isTranslator = typeof ctxOrTranslator === 'function'
    const childContext: LogContext = isTranslator ? { ...baseContext } : { ...baseContext, ...ctxOrTranslator }
    const translate =
      logTranslator && isTranslator
        ? (msg: LogMessage) => (ctxOrTranslator as LogMessageTranslator)(logTranslator(msg))
        : isTranslator
          ? (ctxOrTranslator as LogMessageTranslator)
          : logTranslator
    return createLogger({ context: childContext, targets, translate })
  }

  // creates the wrap helper
  log.wrap = <F extends (...args: any[]) => any>(...args: any[]): F => {
    // normalize arguments
    const [ctx, msg, func] = Array(3 - args.length).concat(args) as [LogContext | number, string, F]
    const context: LogContext =
      typeof ctx === 'number' ? { ...baseContext, [LogContexts.logLevel]: ctx } : { ...baseContext, ...ctx }
    const logLevel: number | undefined = context[LogContexts.logLevel]
    // do not wrap if no target will be used
    if (typeof logLevel === 'number' && targets.every(t => t.minLevel > logLevel)) {
      return func
    }

    // create a default message if none defined
    const message: string = msg == null ? `calling ${func.name || '[anonymous]'}()` : msg

    // wrap the method
    return function wrapped(this: any, ...args: any[]): any {
      // we put the `call` before so that it can be overriden with the given context
      log({ call: { args }, ...context }, message)
      return func.apply(this, args)
    } as F
  }

  // creates each log level helpers
  LogLevelNames.forEach(name => {
    const level: number = (LogLevels as any)[name]
    const extraContext = { [LogContexts.logLevel]: level }

    log[name] = (ctxOrMsg: string | LogContext, ...args: any[]): void => {
      // at the first call, we check if none of our targets would match,
      // and if so we replace ourself with a dummy function
      if (targets.length === 0 || targets.every(t => t.minLevel > level)) {
        log[name] = createEmptyFunction()
        return
      }
      // else we treat the message
      if (typeof ctxOrMsg === 'string') {
        log(extraContext, ctxOrMsg, ...args)
      } else {
        log({ ...ctxOrMsg, ...extraContext }, ...args)
      }
    }
  })

  return log
}

export { createLogger, lastSequenceNumber, Logger, LogMethod, resetSequence, CreateLoggerOptions }

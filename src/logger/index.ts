import { format } from 'util'

import { LogContext, LogContexts } from './context'
import { LogLevelName, LogLevelNames, LogLevels, logLevelNameFor, parseLogLevel } from './level'
import { LogFormatters, LogMessage, LogMessageFormatter, LogMessageTranslator } from './message'
import { DEFAULT_LOG_TARGET, LogTarget, parseLogTargets } from './target'

interface LogMethod {
  (message: string, ...args: any[]): void
  (context: LogContext, message: string, ...args: any[]): void
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

const createLogger = (
  baseContext: LogContext,
  logTargets: LogTarget[] | string = DEFAULT_LOG_TARGET,
  logTranslator?: LogMessageTranslator,
): Logger => {
  const targets = typeof logTargets === 'string' ? parseLogTargets(logTargets) : logTargets
  const log: any = (msgOrCtx: string | LogContext, msg?: string, ...args: any[]) => {
    if (targets.length === 0) {
      return
    }
    const time = Date.now()
    const sequence = ++lastSeqNumber
    let context: LogContext
    if (typeof msgOrCtx === 'string') {
      args.unshift(msg)
      msg = msgOrCtx
      context = { ...baseContext }
    } else {
      context = { ...baseContext, ...msgOrCtx }
    }
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
    destTargets.forEach(t => `${t.stream.write(t.format(logMessage))}\n`)
  }

  // creates the child helper
  log.child = (ctxOrTranslator: LogContext | LogMessageTranslator) => {
    const isTranslator = typeof ctxOrTranslator === 'function'
    const childContext: LogContext = isTranslator ? { ...baseContext } : { ...baseContext, ...ctxOrTranslator }
    return createLogger(childContext, targets, isTranslator ? (ctxOrTranslator as LogMessageTranslator) : undefined)
  }

  // creates the wrap helper
  log.wrap = <F extends (...args: any[]) => any>(...args: any[]): F => {
    // normalize arguments
    const [ctx, msg, func] = Array(3 - args.length).concat(args) as [LogContext | number, string, F]
    // do not wrap if we are not going to log anywhere
    if (!targets.length) {
      return func
    }

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
        log[name] = () => undefined
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

export {
  createLogger,
  DEFAULT_LOG_TARGET,
  LogContext,
  LogContexts,
  LogFormatters,
  Logger,
  LogLevelName,
  logLevelNameFor,
  LogLevels,
  LogMessage,
  LogMessageFormatter,
  LogMessageTranslator,
  LogTarget,
  parseLogLevel,
  parseLogTargets,
}

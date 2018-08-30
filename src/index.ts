import { LogMethod, Logger, createLogger, lastSequenceNumber, resetSequence } from './logger'
import { LogContext, LogContexts } from './logger/context'
import { LogLevelName, LogLevelNames, LogLevels, logLevelNameFor, parseLogLevel } from './logger/level'
import { LogFormatters, LogMessage, LogMessageFormatter, LogMessageTranslator } from './logger/message'
import { DEFAULT_LOG_TARGET, LogTarget, parseLogTargets } from './logger/target'
import { cacheGetters } from './utils/cache-getters'

let cache!: { root: any }
// tslint:disable-next-line:variable-name
const __setup = (factory = () => createLogger({ targets: process.env.LOG_TARGETS })) => {
  cache = cacheGetters(
    {
      get root(): any {
        return factory()
      },
    },
    'root',
  )
}

// creates a lazy logger as default export
const logger: Logger = ((...args: any[]) => cache.root(...args)) as any
const props = [...LogLevelNames, 'child', 'wrap']
for (const prop of props) {
  Object.defineProperty(logger, prop, {
    enumerable: true,
    configurable: true,
    get() {
      return cache.root[prop]
    },
  })
}
cacheGetters(logger as any, ...props)

__setup()

export {
  // main
  logger as default,
  logger,
  // external
  createLogger,
  DEFAULT_LOG_TARGET,
  lastSequenceNumber,
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
  LogMethod,
  LogTarget,
  parseLogLevel,
  parseLogTargets,
  resetSequence,
  // debug
  __setup,
}

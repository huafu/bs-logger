import jsonStringify from 'fast-json-stable-stringify'

import { LogContext, LogContexts } from './context'
import { logLevelNameFor } from './level'

interface LogMessage {
  context: LogContext
  message: string
  sequence: number
  time: number
}

type LogMessageFormatter = (msg: LogMessage) => string
type LogMessageTranslator = (msg: LogMessage) => LogMessage

/**
 * Predefined log formatters
 */
const LogFormatters = {
  json: (msg: LogMessage) => jsonStringify({ ...msg, time: new Date(msg.time) }),
  prefixedMessage: (msg: LogMessage) =>
    `${msg.context[LogContexts.package] || msg.context[LogContexts.application] || 'main'}[${msg.context[
      LogContexts.namespace
    ] || 'root'}] (${logLevelNameFor(msg.context[LogContexts.logLevel]).toUpperCase()}) ${msg.message}`,
}

export { LogMessage, LogMessageTranslator, LogMessageFormatter, LogFormatters }

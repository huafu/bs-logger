import jsonStringify from 'safe-stable-stringify'

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

interface LogFormattersMap {
  json: LogMessageFormatter
  simple: LogMessageFormatter
  [key: string]: LogMessageFormatter
}
/**
 * Predefined log formatters
 */
let LogFormatters: LogFormattersMap = defaultLogFormatters()

const resetLogFormatters = () => {
  LogFormatters = defaultLogFormatters()
}

const registerLogFormatter = (name: string, format: LogMessageFormatter) => {
  LogFormatters[name] = format
}

function defaultLogFormatters() {
  return {
    json: (msg: LogMessage) => jsonStringify({ ...msg, time: new Date(msg.time) }),
    simple: (msg: LogMessage) =>
      `${msg.context[LogContexts.package] || msg.context[LogContexts.application] || 'main'}[${msg.context[
        LogContexts.namespace
      ] || 'root'}] (${logLevelNameFor(msg.context[LogContexts.logLevel]).toUpperCase()}) ${msg.message}`,
  }
}

export {
  LogMessage,
  LogMessageTranslator,
  LogMessageFormatter,
  LogFormatters,
  resetLogFormatters,
  registerLogFormatter,
}

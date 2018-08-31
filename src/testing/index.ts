import { CreateLoggerOptions, Logger, createLogger } from '../logger'
import { setup } from '../logger/root'

import { ExtendedArray, LogTargetMock, extendArray } from './target-mock'

const setupForTesting = (target = new LogTargetMock()) => {
  setup(() => createLoggerMock(undefined, target))
}

interface LoggerMock extends Logger {
  readonly target: LogTargetMock
}

const createLoggerMock = (options?: CreateLoggerOptions, target = new LogTargetMock()): LoggerMock => {
  const opt = { ...options, targets: [target] }
  return Object.assign(createLogger(opt), { target })
}

export { LogTargetMock, ExtendedArray, extendArray, setupForTesting as setup, createLoggerMock }

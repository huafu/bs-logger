import { cacheGetters } from '../utils/cache-getters'

const LogLevels = cacheGetters(
  {
    trace: 10,
    debug: 20,
    info: 30,
    warn: 40,
    error: 50,
    fatal: 60,
    // special ones
    get lower() {
      return LogLevels.trace
    },
    get higher() {
      return LogLevels.fatal
    },
  },
  'lower',
  'higher',
)
type LogLevelName = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal'
const LogLevelNames: LogLevelName[] = ['trace', 'debug', 'info', 'warn', 'error', 'fatal']
const LogLevelValues = LogLevelNames.map(name => (LogLevels as any)[name] as number)

interface LogLevelsScaleEntry {
  range: { from: number; next: number }
  name: string
  test(level: number): boolean
}
const LogLevelsScale: ReadonlyArray<LogLevelsScaleEntry> = LogLevelNames.map((name, index, { length }) => {
  const first = index === 0
  const last = index === length - 1
  const from = first ? -Infinity : LogLevelValues[index]
  const next = last ? +Infinity : LogLevelValues[index + 1]
  let test: (level: number) => boolean
  if (first) {
    test = level => level < next
  } else if (last) {
    test = level => level >= from
  } else {
    test = level => level < next && level >= from
  }
  return { range: { from, next }, name, test }
})

/**
 * Finds the corresponding name for given log level value
 * @param level Level to find name of
 */
const logLevelNameFor = (level?: number): string => {
  if (level == null || isNaN(level)) {
    return LogLevelNames[0]
  }
  return (LogLevelsScale.find(({ test }) => test(level)) as LogLevelsScaleEntry).name
}

/**
 * Transform a log level name or value into its equivalent number
 * @param level Level to be parsed
 */
const parseLogLevel = (level: string | number | LogLevelName): number | undefined => {
  if (typeof level === 'string') {
    level = level.toLowerCase()
    if (level in LogLevels) {
      return LogLevels[level as keyof typeof LogLevels]
    }
    return /^\s*[0-9]+\s*$/.test(level) ? parseInt(level.trim(), 10) : undefined
  }
  return typeof level === 'number' && !isNaN(level) ? +level : undefined
}

export { logLevelNameFor, LogLevels, LogLevelNames, LogLevelValues, LogLevelsScale, parseLogLevel, LogLevelName }

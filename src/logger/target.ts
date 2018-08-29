import { createWriteStream } from 'fs'
import { resolve } from 'path'
import { Writable } from 'stream'

import { cacheGetters } from '../utils/cache-getters'

import { LogLevelNames, LogLevels, parseLogLevel } from './level'
import { LogFormatters, LogMessageFormatter } from './message'

interface LogTarget {
  stream: Writable
  minLevel: number
  format: LogMessageFormatter
}
/**
 * Used to parse a log target with a level: `path/to/file[+]:level`
 */
const logTargetWithLevelRegex = new RegExp(`^\\s*(.+):([0-9]+|${LogLevelNames.join('|')})\\s*$`, 'i')

/**
 * Parse a string corresponding to one or more log target with the log levels:
 * `/path/to/file.log[:min-log-level][,/other/file.log[:min-log-level]]`
 * @param targetString Log target string
 */
const parseLogTargets = (targetString?: string): LogTarget[] => {
  // allow to escape the `,`
  const items = (targetString || '').split(/([^\\]),/g).reduce(
    (list, item, index) => {
      if (index % 2 === 1) {
        list[list.length - 1] += item
      } else {
        list.push(item)
      }
      return list
    },
    [] as string[],
  )

  // create the parsed list of targets
  return items.reduce(
    (targets, str) => {
      const pieces = str.match(logTargetWithLevelRegex)
      let file!: string
      let level!: string
      if (pieces) {
        file = pieces[1].trim()
        level = pieces[2].trim()
      } else {
        file = str.trim()
      }
      // if the file path ends with a + we'll append to it
      const append = file.endsWith('+')
      if (append) {
        file = file.slice(0, -1).trim()
      }
      // allow escaping of commas
      file = file.replace(/\\,/g, ',')
      // no file, let's dismiss this one
      if (!file) {
        return targets
      }

      // creates the target
      const target: LogTarget = cacheGetters(
        {
          get minLevel() {
            return parseLogLevel(level) || -Infinity
          },
          get format() {
            return /^(stdout|stderr)$/i.test(file) ? LogFormatters.prefixedMessage : LogFormatters.json
          },
          get stream(): Writable {
            if (/^(stdout|stderr)$/i.test(file)) {
              return (process as any)[file.toLowerCase()]
            } else {
              return createWriteStream(resolve(process.cwd(), file), {
                flags: append ? 'a' : 'w',
                autoClose: true,
                encoding: 'utf8',
              })
            }
          },
        },
        'minLevel',
        'format',
        'stream',
      )

      // concat
      return [...targets, target]
    },
    [] as LogTarget[],
  )
}

/**
 * By default log only warnings and above to standard error
 */
const DEFAULT_LOG_TARGET = `stderr:${LogLevels.warn}`

export { LogTarget, DEFAULT_LOG_TARGET, parseLogTargets }

import { LogLevelNames, LogLevelValues, LogLevels, LogLevelsScale, logLevelNameFor, parseLogLevel } from './level'

const levelNames = ['trace', 'debug', 'info', 'warn', 'error', 'fatal']
const levelValues = [10, 20, 30, 40, 50, 60]

// export { logLevelNameFor, LogLevels, LogLevelNames, LogLevelValues, LogLevelsScale, parseLogLevel }
describe('logLevelNameFor', () => {
  it('should return the level name for exact level values', () => {
    for (let i = 0; i < levelNames.length; i++) {
      expect(logLevelNameFor(levelValues[i])).toBe(levelNames[i])
    }
  })
  it('should return the level name for any value', () => {
    expect(logLevelNameFor(-Infinity)).toBe(levelNames[0])
    expect(logLevelNameFor(levelValues[0] - 10)).toBe(levelNames[0])
    expect(logLevelNameFor(NaN)).toBe(levelNames[0])
    expect(logLevelNameFor(null as any)).toBe(levelNames[0])
    expect(logLevelNameFor(undefined as any)).toBe(levelNames[0])
    for (let i = 0; i < levelNames.length; i++) {
      expect(logLevelNameFor(levelValues[i] + 1)).toBe(levelNames[i])
    }
    expect(logLevelNameFor(+Infinity)).toBe(levelNames[levelNames.length - 1])
  })
})

describe('LogLevels', () => {
  it('should export the correct map of levels', () => {
    const expected = levelNames.reduce(
      (map, name, index) => {
        map[name] = levelValues[index]
        return map
      },
      {} as any,
    )
    expected.lower = levelValues[0]
    expected.higher = levelValues[levelValues.length - 1]
    expect(LogLevels).toEqual(expected)
  })
})

describe('LogLevelNames', () => {
  it('should contain all log level names in correct order', () => {
    expect(LogLevelNames).toEqual(levelNames)
  })
})

describe('LogLevelValues', () => {
  it('should contain all log level values in correct order', () => {
    expect(LogLevelValues).toEqual(levelValues)
  })
})

describe('LogLevelsScale', () => {
  it('should contain correct number of items', () => {
    expect(LogLevelsScale).toHaveLength(LogLevelNames.length)
  })
  it('should have correct bounds', () => {
    expect(LogLevelsScale[0].range.from).toBe(-Infinity)
    expect(LogLevelsScale[LogLevelsScale.length - 1].range.next).toBe(+Infinity)
  })
  it('should test correctly any value', () => {
    levelValues.forEach((level, i) => {
      expect(LogLevelsScale[i].test(level)).toBe(true)
      expect(LogLevelsScale[i].test(level + 1)).toBe(true)
      expect(LogLevelsScale[i].test(level - 1)).toBe(i === 0 ? true : false)
    })
  })
})

describe('parseLogLevel', () => {
  it('should parse log level names', () => {
    levelNames.forEach((name, index) => {
      expect(parseLogLevel(name)).toBe(levelValues[index])
    })
    expect(parseLogLevel('lower')).toBe(levelValues[0])
    expect(parseLogLevel('higher')).toBe(levelValues[levelValues.length - 1])
  })
  it('should parse log level values', () => {
    levelValues.forEach(val => {
      expect(parseLogLevel(val)).toBe(val)
      expect(parseLogLevel(`${val}`)).toBe(val)
    })
    expect(parseLogLevel(NaN)).toBe(undefined)
    expect(parseLogLevel(null as any)).toBe(undefined)
    expect(parseLogLevel(Infinity)).toBe(Infinity)
    expect(parseLogLevel(-Infinity)).toBe(-Infinity)
  })
  it('should parse invalid log level strings', () => {
    expect(parseLogLevel('foo')).toBe(undefined)
  })
})

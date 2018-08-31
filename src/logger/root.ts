import { cacheGetters } from '../utils/cache-getters'

import { Logger, createLogger } from '.'
import { LogLevelNames } from './level'

let cache!: { root: any }
// tslint:disable-next-line:variable-name
const setup = (factory = () => createLogger({ targets: process.env.LOG_TARGETS || process.env.LOG_TARGET })) => {
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
const rootLogger: Logger = ((...args: any[]) => cache.root(...args)) as any
const props = [...LogLevelNames, 'child', 'wrap']
for (const prop of props) {
  Object.defineProperty(rootLogger, prop, {
    enumerable: true,
    configurable: true,
    get() {
      return cache.root[prop]
    },
  })
}
cacheGetters(rootLogger as any, ...props)

setup()

export { rootLogger, setup }

declare module 'fast-json-stable-stringify' {
  const fastJsonStableStringify: (input: any, opt?: {
    cmp?: (a: {key: PropertyKey, value: any}, b: {key: PropertyKey, value: any}) => number,
    cycles?: boolean,
  }) => string
  export = fastJsonStableStringify
}

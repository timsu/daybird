/** wrap an async method in a promise, rejecting if the function throws errors */
export function AsyncPromise<T>(
  promiseFunction: (
    resolve: (value: T | PromiseLike<T>) => void,
    reject: (e?: any) => void
  ) => Promise<void>
): Promise<T> {
  return new Promise((res, rej) => {
    promiseFunction(res, rej).catch(rej)
  })
}

/** assert a variable is defined or throw an error */
export function assertIsDefined<T>(val: T, message?: string): asserts val is NonNullable<T> {
  if (val === undefined || val === null) {
    throw message || `Expected 'val' to be defined, but received ${val}`
  }
}

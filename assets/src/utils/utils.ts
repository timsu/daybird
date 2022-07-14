import { logger } from '@/utils/logger'

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

/** unwrap backend errors */
export function unwrapError(error: any, defaultMessage?: string) {
  if (!error) return 'Error'
  if (typeof error == 'string') return error
  if (error.response) {
    let response = error.response
    if (response.data) logger.info(response.data)

    const errorObject = response.data.error
    if (errorObject) {
      const message =
        typeof errorObject.message == 'string'
          ? errorObject.message
          : JSON.stringify(errorObject.message)
      const otherKeys = Object.keys(response.data.error).filter(
        (k) => k != 'message' && k != 'resend'
      )
      if (otherKeys.length > 0) {
        return message + ': ' + otherKeys.map((k) => `${k} ${response.data.error[k]}`).join(', ')
      } else {
        return message
      }
    } else {
      return defaultMessage
    }
  } else if (error.message) {
    return error.message
  } else {
    return defaultMessage
  }
}

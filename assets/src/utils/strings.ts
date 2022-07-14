import { logger } from '@/utils/logger'

/** join class names */
export function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

/** make initials from name */
export function makeInitials(name: string) {
  return name
    .split(' ')
    .slice(0, 3)
    .map((word) => word.charAt(0).toUpperCase())
    .join('')
}

export const pluralizeWithCount = (noun: string, num: number) => {
  return num + ' ' + pluralize(noun, num)
}

export const pluralize = (noun: string, num: number) => {
  return `${noun}${num == 1 ? '' : 's'}`
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

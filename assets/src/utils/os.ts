export type OS =
  | 'windows'
  | 'mac'
  | 'linux'
  | 'android'
  | 'ios'
  | 'react-native'
  | 'chrome-os'
  | 'unknown'

let os: OS | null = null
export function getOS(): OS {
  if (os) return os

  if (typeof window === 'undefined') {
    // use node.js version of the check
    switch (process.platform) {
      case 'darwin':
        return (os = 'mac')
      case 'win32':
        return (os = 'windows')
      case 'android':
        return (os = 'android')
      default:
        return 'linux'
    }
  }

  if (typeof navigator != 'undefined' && navigator.product == 'ReactNative')
    return (os = 'react-native')

  let userAgent = window.navigator.userAgent,
    platform = window.navigator.platform,
    macosPlatforms = ['Macintosh', 'MacIntel', 'MacPPC', 'Mac68K'],
    windowsPlatforms = ['Win32', 'Win64', 'Windows', 'WinCE'],
    iosPlatforms = ['iPhone', 'iPad', 'iPod']

  if (/Android/.test(userAgent)) {
    os = 'android'
  } else if (macosPlatforms.indexOf(platform) !== -1) {
    os = 'mac'
  } else if (iosPlatforms.indexOf(platform) !== -1) {
    os = 'ios'
  } else if (windowsPlatforms.indexOf(platform) !== -1) {
    os = 'windows'
  } else if (!os && /Linux/.test(platform)) {
    if (userAgent.includes('CrOS')) os = 'chrome-os'
    else os = 'linux'
  } else {
    os = 'unknown'
  }

  return os
}

export const isEdge = navigator.userAgent?.includes('Edg/')
export const isChrome = navigator.userAgent?.includes('Chrome')
export const isSafari = navigator.userAgent?.includes('Safari') && !isChrome
export const isMac = getOS() == 'mac'
export const isWindows = getOS() == 'windows'
export const isLinux = getOS() == 'linux'
export const isMobile: boolean = ['ios', 'android', 'react-native'].indexOf(getOS()) > -1

export const isSafariWebview = getOS() == 'ios' && !/Safari/.test(navigator.userAgent)

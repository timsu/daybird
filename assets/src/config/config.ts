export const environments = ['dev', 'staging', 'dogfood', 'prod'] as const
export type ENV = typeof environments[number]

const originUrl = typeof location != 'undefined' ? location.origin : ''

const isDev = import.meta.env.DEV
const isTest = !!import.meta.env.IS_TEST

const getEnv = (): ENV => {
  return isDev
    ? 'dev'
    : originUrl.indexOf('//staging') > -1
    ? 'staging'
    : originUrl.indexOf('//dogfood') > -1
    ? 'dogfood'
    : 'prod'
}

const env: ENV = getEnv()

export const notProdOrStaging = isDev || env === 'dogfood'

function getTopicflowUrl(origin_url: string) {
  if (!origin_url) return ''
  if (origin_url.lastIndexOf(':') > 5) {
    const base = origin_url.replace(/https?/, '').replace(/:[0-9]+$/, '')
    const port = isTest ? '7001' : '4100'
    return `ws${base}:${port}`
  } else {
    const base = origin_url.replace(/https?:\/\//, '')
    return `wss://${base}`
  }
}

export const config = {
  // our API endpoint
  apiUrl: '/api/v1',

  // our API host - leave blank to use current server
  apiHost: originUrl,

  // web socket URL
  wsUrl: originUrl.replace('http', 'ws') + '/socket',

  topicflowUrl: getTopicflowUrl(originUrl),

  dev: isDev,

  env,

  hash: import.meta.env.VITE_GIT_HASH?.substr(0, 10),

  sentry: {},

  amplitude: {},
}

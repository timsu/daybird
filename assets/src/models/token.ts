export type AuthToken = {
  token: string
  exp?: number
}

export type AuthTokenPair = {
  refresh?: AuthToken
  access?: AuthToken
  fork?: AuthToken
}

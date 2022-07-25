export const LS_AUTH_TOKENS = 'at'

export const hasToken = () => !!localStorage.getItem(LS_AUTH_TOKENS)

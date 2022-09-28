import uniqolor from 'uniqolor'

export function lightColorFor(id: string) {
  return uniqolor(id, { lightness: [70, 85] }).color
}

export function mediumLightColorFor(id: string) {
  return uniqolor(id, { lightness: [50, 70] }).color
}

export function mediumColorFor(id: string) {
  return uniqolor(id, { lightness: [40, 60] }).color
}

export function darkColorFor(id: string) {
  return uniqolor(id, { lightness: [30, 50] }).color
}

export type ColorSet = {
  bg: string
  textColor?: string
  transparent?: string
}

const savedIdsToColorIndex: { [key: string]: number } = {}

export const COLOR_SCALE_BASE = [
  '#A3C7FE',
  '#B7ABFC',
  '#FEB7FF',
  '#FFA1A1',
  '#FFD4A1',
  '#FFEB82',
  '#C8F382',
  '#A5F6AE',
  '#95E8F4',
]

// bg: c,
// textColor: darken(0.35, shade(0.15, c)),
// transparent: transparentize(0.15, c)
export const COLOR_SCALE: ColorSet[] = [
  {
    bg: '#A3C7FE',
    textColor: '#2c4f82',
    transparent: 'rgba(163,199,254,0.85)',
  },
  {
    bg: '#B7ABFC',
    textColor: '#3d3183',
    transparent: 'rgba(183,171,252,0.85)',
  },
  {
    bg: '#FEB7FF',
    textColor: '#89368a',
    transparent: 'rgba(254,183,255,0.85)',
  },
  {
    bg: '#FFA1A1',
    textColor: '#832b2b',
    transparent: 'rgba(255,161,161,0.85)',
  },
  {
    bg: '#FFD4A1',
    textColor: '#835b2b',
    transparent: 'rgba(255,212,161,0.85)',
  },
  {
    bg: '#FFEB82',
    textColor: '#74671f',
    transparent: 'rgba(255,235,130,0.85)',
  },
  {
    bg: '#C8F382',
    textColor: '#4d6723',
    transparent: 'rgba(200,243,130,0.85)',
  },
  {
    bg: '#A5F6AE',
    textColor: '#317a38',
    transparent: 'rgba(165,246,174,0.85)',
  },
  {
    bg: '#95E8F4',
    textColor: '#2a6871',
    transparent: 'rgba(149,232,244,0.85)',
  },
]

const getIndexesForColorScale = () => Array.from(Array(COLOR_SCALE_BASE.length).keys())

let unusedColorsByIndex: number[] = getIndexesForColorScale()

export function getUniqueColorObjectForId(id: string = ''): ColorSet {
  // use keyd colors based on id for quick and safe retreival
  if (savedIdsToColorIndex[id] != null) {
    return COLOR_SCALE[savedIdsToColorIndex[id]]
  }

  // Repopulate unused colors again when it hits 0 to start the distribution again
  if (!unusedColorsByIndex.length) {
    unusedColorsByIndex = getIndexesForColorScale()
  }

  // Get color index by hash and remove it from list of unused colors
  const colorIndex = unusedColorsByIndex[getHash(id) % unusedColorsByIndex.length]
  unusedColorsByIndex.splice(unusedColorsByIndex.indexOf(colorIndex), 1)

  savedIdsToColorIndex[id] = colorIndex
  return COLOR_SCALE[colorIndex]
}

function hashCode(s: string = '') {
  if (!s.split) return 0
  return s.split('').reduce((a, b) => {
    // tslint:disable-next-line
    a = (a << 5) - a + b.charCodeAt(0)
    // tslint:disable-next-line
    return a & a
  }, 0)
}

export const getHash = (str: string): number => Math.abs(hashCode(str))

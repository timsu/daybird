import { action, atom } from 'nanostores'
import { RouterOnChangeArgs } from 'preact-router'

class UIStore {
  // --- stores

  path = atom<string>()

  // --- actions

  routerOnChange = action(this.path, 'routerOnChange', (store, ctx: RouterOnChangeArgs<any>) => {
    store.set(ctx.path!)
  })
}

export const uiStore = new UIStore()

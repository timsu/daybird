import { createRef, FunctionalComponent, JSX, render } from 'preact'
import tippy, { Instance } from 'tippy.js'

import CommandsListController, {
    MenuComponentProps
} from '@/components/slashmenu/CommandListController'
import { SuggestionKeyDownProps, SuggestionProps } from '@tiptap/suggestion'

const renderItems =
  <T,>(renderComponent: FunctionalComponent<MenuComponentProps<T>>) =>
  () => {
    let container: HTMLDivElement
    let ref = createRef<CommandsListController<T>>()
    let popup: Instance[]

    return {
      onStart: (props: SuggestionProps<T>) => {
        const componentProps = {
          ...props,
          component: renderComponent,
          ref,
        }

        container = document.createElement('div') as HTMLDivElement
        render(<CommandsListController<T> {...componentProps} />, container)

        setTimeout(() => {
          popup = tippy('body', {
            getReferenceClientRect: props.clientRect as () => DOMRect,
            appendTo: () => document.body,
            content: container,
            showOnCreate: true,
            interactive: true,
            trigger: 'manual',
            placement: 'bottom-start',
          })
        }, 0)
      },
      onUpdate(props: SuggestionProps<T>) {
        const newProps = { ...props, ref, component: renderComponent }
        render(<CommandsListController<T> {...newProps} />, container)

        popup[0].setProps({
          getReferenceClientRect: props.clientRect as () => DOMRect,
        })
      },
      onKeyDown(props: SuggestionKeyDownProps) {
        if (!popup[0]?.state.isVisible) return false

        if (props.event.key === 'Escape') {
          popup[0].hide()
          return true
        }

        if (!ref.current) return false

        return ref.current.onKeyDown(props)
      },
      onExit() {
        popup[0].destroy()
      },
    }
  }

export default renderItems

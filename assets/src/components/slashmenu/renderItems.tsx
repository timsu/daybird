import { createRef, FunctionalComponent, JSX, render } from 'preact'
import { useRef } from 'preact/hooks'
import tippy, { Instance } from 'tippy.js'

import CommandsListController, {
    CommandListComponentProps
} from '@/components/slashmenu/CommandListController'
import { CommandItem } from '@/components/slashmenu/commands'
import { ReactRenderer } from '@tiptap/react'
import { SuggestionKeyDownProps, SuggestionProps } from '@tiptap/suggestion'

const renderItems = (renderComponent: FunctionalComponent<CommandListComponentProps>) => () => {
  let container: HTMLDivElement
  let ref = createRef<CommandsListController>()
  let popup: Instance[]

  console.log('render items')

  return {
    onStart: (props: SuggestionProps<CommandItem>) => {
      const componentProps = {
        ...props,
        component: renderComponent,
        ref,
      }

      container = document.createElement('div') as HTMLDivElement
      render(<CommandsListController {...componentProps} />, container)

      requestAnimationFrame(() => {
        popup = tippy('body', {
          getReferenceClientRect: props.clientRect as () => DOMRect,
          appendTo: () => document.body,
          content: container,
          showOnCreate: true,
          interactive: true,
          trigger: 'manual',
          placement: 'bottom-start',
        })
      })
    },
    onUpdate(props: SuggestionProps<CommandItem>) {
      const newProps = { ...props, ref, component: renderComponent }
      render(<CommandsListController {...newProps} />, container)

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

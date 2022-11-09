import { JSX } from 'preact'
import tippy, { Instance } from 'tippy.js'

import { ReactRenderer } from '@tiptap/react'
import { SuggestionKeyDownProps, SuggestionProps } from '@tiptap/suggestion'

import CommandsList, { CommandItem } from './CommandsList'

const renderItems = () => {
  let component: ReactRenderer
  let popup: Instance[]

  return {
    onStart: (props: SuggestionProps<CommandItem>) => {
      component = new ReactRenderer(CommandsList, {
        props,
        editor: props.editor,
      })

      popup = tippy('body', {
        getReferenceClientRect: props.clientRect as () => DOMRect,
        appendTo: () => document.body,
        content: component.element,
        showOnCreate: true,
        interactive: true,
        trigger: 'manual',
        placement: 'bottom-start',
      })
    },
    onUpdate(props: SuggestionProps<CommandItem>) {
      component.updateProps(props)

      popup[0].setProps({
        getReferenceClientRect: props.clientRect as () => DOMRect,
      })
    },
    onKeyDown(props: SuggestionKeyDownProps) {
      if (props.event.key === 'Escape') {
        popup[0].hide()

        return true
      }

      return (component.ref as any).onKeyDown(props)
    },
    onExit() {
      popup[0].destroy()
      component.destroy()
    },
  }
}

export default renderItems

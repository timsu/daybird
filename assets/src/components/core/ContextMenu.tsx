import { ComponentChildren, createContext, Fragment, RenderableProps } from 'preact'
import { useEffect, useState } from 'preact/hooks'

import { classNames, logger } from '@/utils'
import { Dialog, Transition } from '@headlessui/react'

type ContextMenuProps = {
  id: string
  class?: string
}

type ContextMenuFunction = (x: number, y: number, data: any) => void

const contextMenus: { [id: string]: ContextMenuFunction } = {}

export const MenuContext = createContext<((data: any) => void) | undefined>(undefined)

export const ContextMenuWithData = (
  props: ContextMenuProps & { children: (data: any) => ComponentChildren }
) => {
  const [open, setOpen] = useState<{ x: number; y: number } | false>(false)
  const [data, setData] = useState<any>()

  useEffect(() => {
    contextMenus[props.id] = (x: number, y: number, data: any) => {
      setData(data)
      setOpen({ x, y })
    }
  }, [setData])

  if (!open) return null

  const contents = props.children(data)

  const close = () => setOpen(false)

  const addHandler = (ref: HTMLDivElement | null) => {
    if (ref) {
      ref.addEventListener('click', close)
      setTimeout(() => {
        const rect = ref.getBoundingClientRect()
        if (rect.bottom > document.body.clientHeight)
          setOpen((v) => ({ x: (v || rect).x, y: document.body.clientHeight - rect.height }))
        if (rect.right > document.body.clientWidth)
          setOpen((v) => ({ x: document.body.clientWidth - rect.width, y: (v || rect).y }))
      }, 50)
    }
  }

  return (
    <Transition.Root show={!!open} as={Fragment}>
      <Dialog as="div" className="relative z-50 print:hidden" onClose={close}>
        <div ref={addHandler} class="block fixed" style={{ top: open.y, left: open.x }}>
          <div
            class={classNames(
              'bg-white w-60 border border-gray-300 rounded-lg flex flex-col text-sm p-1',
              'select-none  text-gray-900 shadow-lg',
              props.class || ''
            )}
          >
            {contents}
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  )
}

export const ContextMenu = (props: RenderableProps<ContextMenuProps>) => {
  const { children, ...rest } = props
  return <ContextMenuWithData {...rest}>{(_) => children}</ContextMenuWithData>
}

type ContextMenuItemProps = {
  class?: string
  onClick?: (e: MouseEvent) => void
}

export const ContextMenuItem = (props: RenderableProps<ContextMenuItemProps>) => (
  <div
    class={`flex items-center hover:bg-blue-400 p-2 rounded cursor-pointer ${props.class}`}
    onClick={props.onClick}
  >
    {props.children}
  </div>
)

type TriggerProps = {
  id: string
  data?: any
  className?: string
}

export const ContextMenuTrigger = (props: RenderableProps<TriggerProps>) => {
  const onContextMenu = (e: MouseEvent) => {
    e.preventDefault()
    triggerContextMenu(e.clientX, e.clientY, props.id, props.data)
  }
  return (
    <span
      onContextMenu={onContextMenu}
      style="-webkit-touch-callout: none"
      className={props.className}
    >
      {props.children}
    </span>
  )
}

export const triggerContextMenu = (x: number, y: number, id: string, data?: any) => {
  const menu = contextMenus[id]
  x = Math.min(document.body.clientWidth - 300, x)
  if (!menu) logger.warn('Unknown context menu:', id)
  else menu(x, y, data)
}

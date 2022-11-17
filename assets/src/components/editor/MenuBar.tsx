import { useCallback, useEffect, useRef, useState } from 'preact/hooks'

import { classNames } from '@/utils'
import { getOS } from '@/utils/os'
import { CheckCircleIcon, CheckIcon, LinkIcon, ViewListIcon } from '@heroicons/react/outline'
import { Editor } from '@tiptap/core'

export const MenuBar = ({ editor }: { editor: Editor }) => {
  const [_, setUpdate] = useState(0)
  const menuBar = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    // update the menu bar when anything changes
    editor.on('transaction', (e) => {
      if (e.transaction.storedMarksSet || e.transaction.selectionSet) {
        setUpdate(Date.now())
      }
    })

    // fix the menu bar
    const viewport = window.visualViewport
    if (getOS() == 'ios') {
      window.visualViewport!.addEventListener('scroll', resizeHandler)
      window.visualViewport!.addEventListener('resize', resizeHandler)
      function resizeHandler() {
        const top = viewport!.offsetTop + 10
        if (menuBar.current) {
          menuBar.current.style.top = `${top}px`
        }
      }
      return () => {
        window.visualViewport!.removeEventListener('scroll', resizeHandler)
        window.visualViewport!.removeEventListener('resize', resizeHandler)
      }
    }
  }, [])

  if (!editor) {
    return null
  }

  const setLink = useCallback(() => {
    const previousUrl = editor.getAttributes('link').href
    if (previousUrl) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }

    let url = window.prompt('URL', previousUrl)
    if (!url) return
    if (!url.includes('://')) url = 'https://' + url
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }, [editor])

  return (
    <div
      ref={menuBar}
      className="menubar print:hidden flex overflow-hidden fixed bg-white sm:relative z-20 sm:z-0 top-[10px] w-full sm:w-auto"
    >
      <button
        onClick={() => editor.chain().focus().toggleTaskList().run()}
        disabled={!editor.can().chain().toggleTaskList().run()}
        className={editor.isActive('task') ? 'is-active' : ''}
        title="Insert Task"
      >
        <CheckIcon />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        className={editor.isActive('bold') ? 'is-active' : ''}
        title="Bold"
      >
        <b>B</b>
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        className={editor.isActive('italic') ? 'is-active' : ''}
        title="Italic"
      >
        <i>i</i>
      </button>
      <button
        onClick={() => editor.chain().focus().toggleStrike().run()}
        disabled={!editor.can().chain().focus().toggleStrike().run()}
        className={editor.isActive('strike') ? 'is-active' : ''}
        title="Strikethrough"
      >
        <s>S</s>
      </button>
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={editor.isActive('heading', { level: 1 }) ? 'is-active' : ''}
        title="Heading 1"
      >
        H1
      </button>
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}
        title="Heading 2"
      >
        H2
      </button>
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={classNames(
          'hidden sm:block',
          editor.isActive('heading', { level: 3 }) ? 'is-active' : ''
        )}
        title="Heading 3"
      >
        H3
      </button>
      <button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={editor.isActive('bulletList') ? 'is-active' : ''}
        title="Bullet List"
      >
        &bull;
      </button>
      <button
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={editor.isActive('orderedList') ? 'is-active' : ''}
        title="Numbered List"
      >
        1.
      </button>
      <button
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        className={classNames(
          'hidden sm:block font-mono',
          editor.isActive('codeBlock') ? 'is-active' : ''
        )}
        title="Code Block"
      >
        code
      </button>
      <button
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={classNames('hidden sm:block', editor.isActive('blockquote') ? 'is-active' : '')}
        title="Block Quote"
      >
        &raquo;
      </button>
      <button
        onClick={setLink}
        className={classNames('hidden sm:block', editor.isActive('link') ? 'is-active' : '')}
        title="Link"
      >
        <LinkIcon />
      </button>
      <button
        title="Horizontal Line"
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
      >
        &#8211;
      </button>
    </div>
  )
}

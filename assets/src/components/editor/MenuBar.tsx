import { useEffect, useState } from 'preact/hooks'

import { TaskItem } from '@/components/editor/TaskItem'
import { classNames } from '@/utils'
import { CheckCircleIcon, CheckIcon, ViewListIcon } from '@heroicons/react/outline'
import { Editor } from '@tiptap/core'

export const MenuBar = ({ editor }: { editor: Editor }) => {
  const [_, setUpdate] = useState(0)

  useEffect(() => {
    // update the menu bar when anything changes
    editor.on('selectionUpdate', () => setUpdate(Date.now()))
  }, [])

  if (!editor) {
    return null
  }

  const createTask = () => {
    const newNode = {
      type: 'task',
      attrs: { id: 'focus' },
    }

    editor.commands.insertContent(newNode)
  }

  return (
    <div
      className="menubar flex overflow-hidden fixed bg-white sm:relative
        top-[15px] left-[70px] sm:top-0 sm:left-0 z-20 sm:z-0"
    >
      <button
        onClick={createTask}
        disabled={!editor.can().chain().toggleNode('task', 'task').run()}
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
        title="Horizontal Line"
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
      >
        &#8211;
      </button>
    </div>
  )
}

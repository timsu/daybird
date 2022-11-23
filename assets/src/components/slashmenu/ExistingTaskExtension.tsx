import { task } from 'nanostores'
import { PluginKey } from 'prosemirror-state'

import { NODE_NAME } from '@/components/editor/LegacyTaskItem'
import { MenuComponentProps } from '@/components/slashmenu/CommandListController'
import renderItems from '@/components/slashmenu/renderItems'
import { Task, TaskType } from '@/models'
import { projectStore } from '@/stores/projectStore'
import { taskStore } from '@/stores/taskStore'
import { Editor, Extension, Range } from '@tiptap/core'
import Suggestion, { SuggestionOptions } from '@tiptap/suggestion'

type ExtensionOptions = {
  suggestion: Partial<SuggestionOptions<Task>>
}

const pluginKey = new PluginKey('existingtasks')

const TaskMenu = function ({ items, selectedIndex, selectItem }: MenuComponentProps<Task>) {
  return (
    <div class="shadow rounded bg-white flex flex-col w-96 max-h-56 overflow-auto">
      {items.map((item, index) => {
        return (
          <button
            className={`text-left p-2 hover:bg-gray-400 flex ${
              index === selectedIndex ? 'bg-gray-300' : ''
            }`}
            key={index}
            onClick={() => selectItem(index)}
            ref={(ref) => ref && index === selectedIndex && ref.scrollIntoView()}
          >
            <div class="flex-1">{item.title}</div>
            {item.short_code && <div class="opacity-50">{item.short_code}</div>}
          </button>
        )
      })}
    </div>
  )
}

const loadTasks = ({ query, editor }: { query: string; editor: Editor }) => {
  const lowerQuery = query.toLowerCase()

  const tasksInDoc = new Set<string>()
  const projectId = projectStore.currentProject.get()!.id
  const allTasks = taskStore.taskLists.get()[projectId]
  const doc = editor.state.doc
  doc.descendants((node, pos) => {
    if (node.type.name == NODE_NAME) {
      const id = node.attrs.id
      tasksInDoc.add(id)
    }
  })
  const tasks = allTasks
    .filter(
      (t) =>
        !t.completed_at &&
        !t.archived_at &&
        !tasksInDoc.has(t.id) &&
        (!query || t.title.toLowerCase().includes(lowerQuery))
    )
    .slice(0, 20)

  if (tasks.length == 0)
    tasks.push({ id: '', title: 'No tasks to insert', short_code: '', type: TaskType.TASK })
  return tasks
}

const ExistingTasksExtension = Extension.create<ExtensionOptions>({
  name: 'existingtasks',

  addOptions() {
    return {
      ...this.parent?.(),
      suggestion: {
        char: '//',
        startOfLine: true,
        items: loadTasks,
        render: renderItems(TaskMenu),
        command: ({ editor, range, props }) => {
          if (!props.id) return editor.chain().deleteRange(range).focus().run()

          const taskItem = taskStore.taskItemForTask(props)
          if (editor.isActive('taskList')) {
            const currentNode = editor.state.selection.$head.node()
            let chain = editor.chain()
            chain.deleteNode('taskItem').insertContent(taskItem).focus().run()
          } else {
            const taskList = {
              type: 'taskList',
              content: [taskItem],
            }
            editor.chain().deleteRange(range).insertContent(taskList).focus().run()
          }
        },
      },
    }
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        pluginKey,
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ]
  },
})

export default ExistingTasksExtension

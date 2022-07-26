import { Fragment } from 'preact'
import { route } from 'preact-router'
import { useEffect, useState } from 'preact/hooks'
import { stringSimilarity } from 'string-similarity-js'

import { ModalWithoutPadding } from '@/components/modals/Modal'
import { paths } from '@/config'
import { DOC_EXT, fileStore } from '@/stores/fileStore'
import { modalStore } from '@/stores/modalStore'
import { projectStore } from '@/stores/projectStore'
import { classNames } from '@/utils'
import { isMac } from '@/utils/os'
import { BriefcaseIcon, DocumentIcon, SearchIcon } from '@heroicons/react/outline'
import { useStore } from '@nanostores/preact'

type SearchResult = {
  type: 'file' | 'project'
  name: string
  desc?: string
  href: string
  score: number
}

export default () => {
  const open = useStore(modalStore.quickFindModal)

  useEffect(() => {
    document.addEventListener('keydown', (e: KeyboardEvent) => {
      const modifier = isMac ? e.metaKey : e.ctrlKey
      if (modifier && e.key == 'p') {
        modalStore.quickFindModal.set(true)
        e.preventDefault()
      }
    })
  }, [])

  if (!open) return null

  const close = () => {
    modalStore.quickFindModal.set(false)
  }

  return (
    <ModalWithoutPadding
      open={open}
      close={close}
      contentClass="flex items-start mt-5 sm:mt-20 justify-center min-h-full"
    >
      <QuickSearchBody close={close} />
    </ModalWithoutPadding>
  )
}

function QuickSearchBody({ close }: { close: () => void }) {
  const [searchText, setSearchText] = useState<string>('')
  const [results, setResults] = useState<SearchResult[] | undefined>()
  const [selected, setSelected] = useState<number | undefined>()

  useEffect(() => {
    if (!searchText) {
      setResults(undefined)
      return
    }

    const substringLength = searchText.length < 4 ? searchText.length : undefined

    const files = fileStore.files.get()
    const project = projectStore.currentProject.get()
    const projects = projectStore.projects.get()
    const results: SearchResult[] = files
      .filter((f) => f.type == 'doc')
      .map(
        (f) =>
          ({
            type: 'file',
            name: f.name,
            desc: project!.name,
            href: `${paths.DOC}/${project!.id}/${f.path}`,
            score: stringSimilarity(searchText, f.name, substringLength),
          } as SearchResult)
      )
      .filter((s) => s.score > 0)
      .concat(
        projects
          .map(
            (p) =>
              ({
                type: 'project',
                name: p.name,
                desc: p.id == project?.id ? 'Current Project' : 'Project',
                href: `${paths.PROJECTS}/${p.id}`,
                score: stringSimilarity(searchText, p.name, substringLength),
              } as SearchResult)
          )
          .filter((s) => s.score > 0)
      )
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)

    setResults(results)
    setSelected(undefined)
  }, [searchText])

  useEffect(() => {
    if (!results?.length) return

    setSelected(0)

    const keyListener = (e: KeyboardEvent) => {
      console.log(e.key)
      if (e.key == 'ArrowDown') {
        e.preventDefault()
        setSelected((prev) => {
          const newValue = (prev ?? -1) + 1
          return Math.min(newValue, results.length - 1)
        })
      } else if (e.key == 'ArrowUp') {
        e.preventDefault()
        setSelected((prev) => {
          const newValue = (prev ?? results.length) - 1
          return Math.max(newValue, 0)
        })
      } else if (e.key == 'Enter') {
        e.preventDefault()
        setSelected((val) => {
          const item = results[val ?? 0]
          if (item) {
            route(item.href)
            close()
          }
          return val
        })
      }
    }
    document.addEventListener('keydown', keyListener)
    return () => document.removeEventListener('keydown', keyListener)
  }, [results])

  return (
    <>
      <div class="relative shadow-sm">
        <input
          class="block w-full appearance-none bg-transparent py-4 pl-4 pr-12 text-base
            text-slate-900 placeholder:text-slate-600 without-ring sm:text-sm sm:leading-6"
          placeholder="Jump to..."
          type="text"
          value={searchText}
          onChange={(e) => setSearchText((e.target as HTMLInputElement).value)}
        />
        <SearchIcon class="absolute top-4 right-4 h-6 w-6 text-slate-400" />
      </div>
      {results === undefined ? (
        <></>
      ) : results.length === 0 ? (
        <div class="p-8 mx-auto text-sm text-gray-500 uppercase font-semibold">No results</div>
      ) : (
        <ul class="max-h-[18.375rem] divide-y divide-slate-200 overflow-y-auto rounded-b-lg border-t border-slate-200 text-sm leading-6">
          {results.map((r, idx) => (
            <a href={r.href} key={r.href}>
              <li
                class={classNames('flex items-center p-4', selected == idx ? 'bg-blue-300' : '')}
                ref={(elem) =>
                  selected == idx && elem?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
                }
              >
                {r.type == 'file' ? (
                  <DocumentIcon class="w-4 h-4" />
                ) : (
                  <BriefcaseIcon class="w-4 h-4" />
                )}
                <span class="ml-4 whitespace-nowrap font-semibold text-slate-900 grow">
                  {r.name}
                </span>
                <span class="ml-4 text-right text-xs text-slate-600">{r.desc}</span>
              </li>
            </a>
          ))}
        </ul>
      )}
    </>
  )
}
import flatten from 'lodash.flatten'
import { Fragment } from 'preact'
import { route } from 'preact-router'
import { useEffect, useState } from 'preact/hooks'
import { stringSimilarity } from 'string-similarity-js'

import { ModalWithoutPadding } from '@/components/modals/Modal'
import { paths } from '@/config'
import useShortcut, { checkShortcut } from '@/hooks/useShortcut'
import { File, FileType } from '@/models'
import { DOC_EXT, fileStore, isDailyFile } from '@/stores/fileStore'
import { modalStore } from '@/stores/modalStore'
import { projectStore } from '@/stores/projectStore'
import { uiStore } from '@/stores/uiStore'
import { classNames, logger } from '@/utils'
import { isMac } from '@/utils/os'
import { BriefcaseIcon, DocumentIcon, LinkIcon, SearchIcon } from '@heroicons/react/outline'
import { useStore } from '@nanostores/preact'

type SearchResult = {
  type: 'file' | 'project' | 'link'
  name: string
  desc?: string
  href: string
  score: number
}

export default () => {
  const open = useStore(modalStore.quickFindModal)

  useShortcut((e) => {
    if (checkShortcut(e, 'p')) {
      modalStore.quickFindModal.set(true)
      return true
    }
    return false
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
    const projects = projectStore.projects.get()
    if (!searchText) {
      const allFiles = fileStore.idToFile.get()
      const recentResults: SearchResult[] = uiStore.recentFiles
        .map(({ id, projectId, title }) => {
          const f: File | undefined = allFiles[id]
          const href = isDailyFile(title)
            ? `${paths.TODAY}?d=${title}`
            : `${paths.DOC}/${projectId}/${id}`
          if (href == location.pathname) return null
          const project = projects.find((p) => p.id == projectId)
          return {
            type: 'file',
            name: f?.name || title,
            desc: project?.name,
            href,
            score: 1,
          }
        })
        .filter(Boolean) as SearchResult[]
      setResults(recentResults.length > 0 ? recentResults : undefined)
      return
    }

    const substringLength = searchText.length < 4 ? searchText.length : undefined
    const currentProject = projectStore.currentProject.get()

    const linkResults: SearchResult[] = [
      { name: 'Today', href: paths.TODAY },
      { name: 'All Tasks', href: paths.TASKS + '/' + currentProject?.id },
      { name: 'All Projects', href: paths.PROJECTS },
      { name: 'Project Settings', href: paths.PROJECTS + '/' + currentProject?.id },
      { name: 'User Settings', href: paths.SETTINGS },
    ].map((t) => ({
      type: 'link',
      name: t.name,
      href: t.href,
      score: stringSimilarity(searchText, t.name, substringLength),
    }))

    const allFiles = fileStore.files.get()
    const results: SearchResult[] = flatten(
      Object.keys(allFiles).map((projectId) => {
        const projectFiles = flatten(allFiles[projectId]) as File[]
        const project = projects.find((p) => p.id == projectId)
        return projectFiles
          .filter((f) => f.type == FileType.DOC)
          .map(
            (f) =>
              ({
                type: 'file',
                name: f.name,
                desc: project!.name,
                href: isDailyFile(f.name)
                  ? `${paths.TODAY}?d=${f.name}`
                  : `${paths.DOC}/${projectId}/${f.id}`,
                score: stringSimilarity(searchText, f.name, substringLength),
              } as SearchResult)
          )
          .filter((s) => s.score > 0)
      })
    )
      .concat(
        projects
          .map(
            (p) =>
              ({
                type: 'project',
                name: p.name,
                desc: 'Project',
                href: `${paths.TODAY}?p=${p.id}`,
                score: stringSimilarity(searchText, p.name, substringLength),
              } as SearchResult)
          )
          .filter((s) => s.score > 0)
      )
      .concat(linkResults)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)

    setResults(results)
    setSelected(undefined)
  }, [searchText])

  useEffect(() => {
    if (!results?.length) return

    setSelected(0)

    const keyListener = (e: KeyboardEvent) => {
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
          logger.info('Routing to', item)
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
        <div class="p-2 mx-auto text-sm text-gray-500 uppercase font-semibold">No results</div>
      ) : (
        <>
          {!searchText && (
            <div class="p-2 mx-auto text-sm text-gray-500 uppercase font-semibold">
              Recent Notes
            </div>
          )}
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
                  ) : r.type == 'project' ? (
                    <BriefcaseIcon class="w-4 h-4" />
                  ) : (
                    <LinkIcon class="w-4 h-4" />
                  )}
                  <span class="ml-4 whitespace-nowrap font-semibold text-slate-900 grow">
                    {r.name}
                  </span>
                  <span class="ml-4 text-right text-xs text-slate-600">{r.desc}</span>
                </li>
              </a>
            ))}
          </ul>
        </>
      )}
    </>
  )
}

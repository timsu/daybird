import { AxiosError } from 'axios'
import { parse, parseISO } from 'date-fns'
import { atom, map } from 'nanostores'
import toast from 'react-hot-toast'

import { API } from '@/api'
import { config } from '@/config'
import { DailyNote, Period, Project } from '@/models'
import { authStore } from '@/stores/authStore'
import { docStore } from '@/stores/docStore'
import { unwrapError } from '@/utils'

export const DOC_EXT = '.seq'

type NoteMap = { [date: string]: DailyNote }

class JournalStore {
  // --- stores

  project?: Project
  notes = atom<NoteMap | undefined>()

  // --- actions

  loadNotes = async (project: Project, type: Period, start: string, end: string) => {
    if (this.project?.id != project.id) {
      this.notes.set(undefined)
      this.project = project
    }

    try {
      const response = await API.listNotes(project, type, start, end)
      const notes: DailyNote[] = response.notes.map((f) => DailyNote.fromJSON(f, project.id))

      const noteMap = this.notes.get() || {}
      notes.forEach((n) => (noteMap[n.date] = n))
      this.notes.set(noteMap)

      return notes
    } catch (e) {
      const status = (e as AxiosError).response?.status
      if (status == 401 || status == 404) {
        API.getUser()
          .then(() => {
            // user fetch success. this means the project is not accessible
            toast.error('Error loading files: ' + unwrapError(e))
          })
          .catch(() => {
            // user fetch failed. this mean token is expired.
            authStore.logout()
          })
      }
    }
  }

  saveNote = async (
    project: Project,
    type: Period,
    date: string,
    contents: any,
    snippet: string,
    id?: string
  ) => {
    const response = await API.saveNote(project, type, date, contents, snippet, id)
    const note = DailyNote.fromJSON(response.note, project.id)
    const notes = this.notes.get() || {}
    this.notes.set({ ...notes, [note.date]: note })
    return note
  }

  generateAISummary = async (notes: DailyNote[]): Promise<string> => {
    if (notes.length == 0) return 'No notes for this time period'

    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const noteContents = notes
      .map((n) => days[parseISO(n.date).getDay()] + ':' + n.snippet)
      .join('\n')
    const response = await API.generateSummary(noteContents)
    return response
  }
}

export const journalStore = new JournalStore()
if (config.dev) (window as any)['journalStore'] = journalStore

import { AxiosError } from 'axios'
import { atom, map } from 'nanostores'
import toast from 'react-hot-toast'

import { API } from '@/api'
import { config } from '@/config'
import { DailyNote, Project } from '@/models'
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

  loadNotes = async (project: Project, start: string, end: string) => {
    if (this.project?.id != project.id) {
      this.notes.set(undefined)
      this.project = project
    }

    try {
      const response = await API.listNotes(project, start, end)
      const notes: DailyNote[] = response.notes.map((f) => DailyNote.fromJSON(f, project.id))

      const noteMap = this.notes.get() || {}
      notes.forEach((n) => (noteMap[n.date] = n))
      this.notes.set(noteMap)
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

  saveNote = async (project: Project, date: string, contents: any, snippet: string) => {
    const response = await API.saveNote(project, date, contents, snippet)
    const note = DailyNote.fromJSON(response.note, project.id)
    const notes = this.notes.get() || {}
    this.notes.set({ ...notes, [note.id]: note })
    return note
  }
}

export const journalStore = new JournalStore()
if (config.dev) (window as any)['journalStore'] = journalStore

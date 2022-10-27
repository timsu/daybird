import { StateUpdater, useState } from 'preact/hooks'

import Button from '@/components/core/Button'
import { ModalWithoutPadding } from '@/components/modals/Modal'
import create_task from '@/images/create_task.mp4'
import install_daybird from '@/images/install_daybird.mp4'
import new_notes from '@/images/new_notes.mp4'
import { authStore } from '@/stores/authStore'
import { modalStore } from '@/stores/modalStore'
import { ctrlOrCommand } from '@/utils'
import { Dialog } from '@headlessui/react'
import { useStore } from '@nanostores/preact'

enum Page {
  INTRO = 0,
  NOTES,
  MORE,
}

export default () => {
  const [page, setPage] = useState<Page>(Page.INTRO)
  const open = useStore(modalStore.onboardingModal)

  if (!open) return null

  const close = () => {
    modalStore.onboardingModal.set(false)
    authStore.updateUser({ meta: { ob: 1 } })
  }

  return (
    <ModalWithoutPadding open={!!open} close={() => {}}>
      <div class="p-6 text-gray-700 text-left min-w-[400px]">
        {page == Page.INTRO && <IntroPage setPage={setPage} />}
        {page == Page.NOTES && <NotesPage setPage={setPage} />}
        {page == Page.MORE && <MorePage setPage={setPage} close={close} />}
      </div>
    </ModalWithoutPadding>
  )
}

const IntroPage = ({ setPage }: { setPage: StateUpdater<Page> }) => {
  return (
    <>
      <Dialog.Title
        as="h3"
        className="mt-3 text-xl text-center leading-6 font-medium text-gray-900"
      >
        Welcome to Daybird!
      </Dialog.Title>
      <div className="mt-6">
        Daybird is a daily planning app that lets you take notes and create tasks throughout the
        day. Use the calendar to access notes from previous days.
      </div>

      <div className="mt-6">
        Within a note, type <code>[]</code> to create a task:
      </div>

      <div className="mt-3 flex justify-center">
        <video src={create_task} loop autoPlay muted />
      </div>

      <div className="mt-3">
        Once a task is created, you can click on the id of the task for more options.
      </div>

      <div className="mt-5 sm:mt-6 flex justify-center gap-2">
        <Button onClick={() => setPage(Page.NOTES)}>Next</Button>
      </div>
    </>
  )
}

const NotesPage = ({ setPage }: { setPage: StateUpdater<Page> }) => {
  return (
    <>
      <Dialog.Title
        as="h3"
        className="mt-3 text-xl text-center leading-6 font-medium text-gray-900"
      >
        Creating Notes
      </Dialog.Title>
      <div className="mt-6">
        You can also create notes and folders in the left sidebar. Right-click in the NOTES area to
        bring up the note creation menu.
      </div>

      <div className="mt-3 flex justify-center">
        <video src={new_notes} loop autoPlay muted />
      </div>

      <div className="mt-6">Quickly switch between notes with {ctrlOrCommand()}+P.</div>

      <div className="mt-5 sm:mt-6 flex justify-center gap-2">
        <Button className="bg-gray-500" onClick={() => setPage(Page.INTRO)}>
          Prev
        </Button>
        <Button onClick={() => setPage(Page.MORE)}>Next</Button>
      </div>
    </>
  )
}

const MorePage = ({ setPage, close }: { setPage: StateUpdater<Page>; close: () => void }) => {
  return (
    <>
      <Dialog.Title
        as="h3"
        className="mt-3 text-xl text-center leading-6 font-medium text-gray-900"
      >
        Projects & Apps
      </Dialog.Title>
      <div className="mt-6">
        You can create multiple projects to separate your contexts (for example, home and work).
        Projects can be shared with collaborators.
      </div>

      <div className="mt-6">
        One more thing! Daybird can be installed as an app on your desktop and iOS and Android
        devices for quick access.
      </div>

      <div className="mt-3 flex justify-center">
        <video src={install_daybird} loop autoPlay muted />
      </div>

      <div className="mt-5 sm:mt-6 flex justify-center gap-2">
        <Button className="bg-gray-500" onClick={() => setPage(Page.NOTES)}>
          Prev
        </Button>
        <Button onClick={close}>Let's go!</Button>
      </div>
    </>
  )
}

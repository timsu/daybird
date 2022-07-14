import Button from '@/components/core/Button'
import NewProjectModal from '@/screens/app/NewProjectModal'
import NoProjects from '@/screens/app/NoProjects'
import { modalStore } from '@/stores/modalStore'
import { PlusIcon } from '@heroicons/react/solid'

type Props = {
  path: string
}
export default (props: Props) => (
  <>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
      <h1 className="text-2xl font-semibold text-gray-900">Projects</h1>
    </div>

    <div className="h-8" />

    <NoProjects />

    <div className="mt-6 text-center">
      <Button onClick={() => modalStore.newProjectModal.set(true)}>
        <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
        New Project
      </Button>
    </div>

    <NewProjectModal />
  </>
)

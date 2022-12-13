import Helmet from '@/components/core/Helmet'
import AppHeader from '@/components/layout/AppHeader'
import { Period } from '@/models'
import DailyNoteList from '@/screens/insight/DailyNoteList'
import { uiStore } from '@/stores/uiStore'

type Props = {
  path: string
}

export default (props: Props) => {
  return (
    <>
      <Helmet title={'Daily Journal'} />

      <AppHeader>
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 whitespace-nowrap overflow-hidden overflow-ellipsis">
          Daily Journal
        </h1>
      </AppHeader>

      <div class="flex flex-col grow w-full px-2 sm:px-6 max-w-4xl">
        {!uiStore.insightLoop && (
          <div class="m-4 bg-yellow-100 rounded-md border-yellow-300 border p-4">
            Daily Journal is a sneak peek at an experimental new product called InsightLoop. Write a
            short entry every day and see patterns develop over time.
          </div>
        )}
        <DailyNoteList period={Period.DAY} />
      </div>
    </>
  )
}

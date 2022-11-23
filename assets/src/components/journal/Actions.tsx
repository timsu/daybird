import Timer from '@/components/journal/Timer'
import { uiStore } from '@/stores/uiStore'
import { useStore } from '@nanostores/preact'

export default function Actions() {
  const calendarOpen = useStore(uiStore.calendarOpen)
  const buttonClass = 'hidden ' + (calendarOpen ? 'lg:block' : 'sm:block')
  return (
    <>
      {/* <InsertTasksButton buttonClass={buttonClass} /> */}
      <Timer buttonClass={buttonClass} />
    </>
  )
}

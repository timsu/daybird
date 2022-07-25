import { CSSTransition } from 'preact-transitioning'

import Banner from '@/components/core/Banner'
import Helmet from '@/components/core/Helmet'
import Document from '@/components/editor/Document'
import { docStore } from '@/stores/docStore'
import { DOC_EXT, getNameFromPath } from '@/stores/fileStore'
import { useStore } from '@nanostores/preact'

type Props = {
  path: string
  projectId?: string
  filename?: string
}
export default (props: Props) => {
  const docError = useStore(docStore.docError)

  const title = props.filename ? getNameFromPath(props.filename) : ''

  return (
    <>
      <Helmet title={title} />
      <CSSTransition appear in={!!docError} classNames="fade" duration={500}>
        <div class="relative bg-red-500">
          <Banner onClose={() => docStore.docError.set(undefined)}>
            <p>{docError}</p>
          </Banner>
        </div>
      </CSSTransition>
      <div class="flex flex-col grow bg-white w-full">
        <div class="w-full max-w-2xl mx-auto pt-6 px-8">
          <h1 class="text-xl font-bold ">{title}</h1>
        </div>
        <Document projectId={props.projectId} filename={props.filename} />
      </div>
    </>
  )
}

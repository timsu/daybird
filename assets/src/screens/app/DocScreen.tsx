import { CSSTransition } from 'preact-transitioning'

import Banner from '@/components/core/Banner'
import Helmet from '@/components/core/Helmet'
import Document from '@/components/editor/Document'
import { docStore } from '@/stores/docStore'
import { DOC_EXT } from '@/stores/fileStore'
import { useStore } from '@nanostores/preact'

type Props = {
  path: string
  projectId?: string
  filename?: string
}
export default (props: Props) => {
  const docError = useStore(docStore.docError)

  const title = props.filename
    ? props.filename.substring(props.filename.lastIndexOf('/')).replace(DOC_EXT, '')
    : ''

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
      <div class="grow bg-white w-full">
        <Document projectId={props.projectId} filename={props.filename} />
      </div>
    </>
  )
}

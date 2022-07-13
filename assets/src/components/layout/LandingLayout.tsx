import { RenderableProps } from 'preact'

import Footer from '@/components/core/Footer'
import Header from '@/components/core/Header'

export default function (props: RenderableProps<{}>) {
  return (
    <div class="h-full flex flex-col">
      <Header />
      <div className="grow bg-gray-50">{props.children}</div>
      <Footer />
    </div>
  )
}

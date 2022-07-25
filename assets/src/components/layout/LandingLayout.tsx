import { RenderableProps } from 'preact'

import Footer from '@/components/core/Footer'
import Header from '@/components/core/Header'

export default function (props: RenderableProps<{ darkFooter?: boolean }>) {
  return (
    <div class="h-full flex flex-col min-w-[400px]">
      <Header />
      <div className="flex flex-col grow bg-gray-50">{props.children}</div>
      <Footer dark={props.darkFooter} />
    </div>
  )
}

import { RenderableProps } from 'preact'

import Footer from '@/components/landing/Footer'
import Header from '@/components/landing/Header'

export default function (props: RenderableProps<{ darkFooter?: boolean }>) {
  return (
    <div class="h-full flex flex-col">
      <Header />
      <div className="flex flex-col grow bg-gray-50">{props.children}</div>
      <Footer dark={props.darkFooter} />
    </div>
  )
}

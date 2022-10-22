import { RenderableProps } from 'preact'

import Footer from '@/components/landing/Footer'
import Header from '@/components/landing/Header'

export default function (props: RenderableProps<{ darkFooter?: boolean }>) {
  return (
    <div class="h-full flex flex-col bg-lavender-50">
      <Header />
      {props.children}
      <Footer dark={props.darkFooter} />
    </div>
  )
}

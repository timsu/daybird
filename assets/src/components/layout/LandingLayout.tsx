import Footer from '@/components/core/Footer'
import Header from '@/components/core/Header'
import { RenderableProps } from 'preact'

export default function (props: RenderableProps<{}>) {
  return (
    <div class="h-full flex flex-col">
      <Header />
      <div className="grow">{props.children}</div>
      <Footer />
    </div>
  )
}

import { render } from 'preact'
import Landing from './screens/landing/Landing'

import '@/styles/index.css'
import 'vite/modulepreload-polyfill'

render(<Landing />, document.getElementById('app')!)

import '@/styles/index.css'
import 'vite/modulepreload-polyfill'

import { render } from 'preact'

import Insight from '@/screens/insight/Insight'

render(<Insight />, document.getElementById('app')!)

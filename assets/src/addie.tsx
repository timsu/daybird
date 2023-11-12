import '@/styles/index.css'
import 'vite/modulepreload-polyfill'

import { render } from 'preact'

import Addie from '@/screens/addie/Addie'

render(<Addie />, document.getElementById('app')!)

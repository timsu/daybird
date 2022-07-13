import '@/styles/index.css'
import 'vite/modulepreload-polyfill'

import { render } from 'preact'

import AuthRouter from '@/screens/auth/AuthRouter'

render(<AuthRouter />, document.getElementById('app')!)

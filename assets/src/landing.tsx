import '@/styles/index.css'
import 'vite/modulepreload-polyfill'

import { render } from 'preact'

import LandingRouter from '@/screens/landing/LandingRouter'

render(<LandingRouter />, document.getElementById('app')!)

import { render } from 'preact'
import App from './screens/app/App'

import '@/styles/index.css'
import 'vite/modulepreload-polyfill'

render(<App />, document.getElementById('app')!)

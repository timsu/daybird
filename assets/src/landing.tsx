import { render } from 'preact'
import Landing from './screens/Landing'

import './index.css'
import 'vite/modulepreload-polyfill'

render(<Landing />, document.getElementById('app')!)

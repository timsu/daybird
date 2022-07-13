import { render } from 'preact'
import { App } from './app'
import './index.css'
import 'vite/modulepreload-polyfill'

render(<App />, document.getElementById('app')!)

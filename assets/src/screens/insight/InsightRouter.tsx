import Router, { route } from 'preact-router'
import { useEffect } from 'preact/hooks'

import { paths } from '@/config'
import Journal from '@/screens/insight/Journal'
import { uiStore } from '@/stores/uiStore'

export default () => (
  <Router onChange={uiStore.routerOnChange}>
    <Journal path={paths.JOURNAL} />
    <Redirect path={'/insight'} to={paths.JOURNAL} />
  </Router>
)

const Redirect = ({ to }: { to: string; path: string }) => {
  useEffect(() => {
    route(to)
  }, [])
  return null
}

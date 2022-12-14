import Router, { route } from 'preact-router'
import { useEffect } from 'preact/hooks'

import { paths } from '@/config'
import DocScreen from '@/screens/app/DocScreen'
import Settings from '@/screens/app/Settings'
import Insights from '@/screens/insight/Insights'
import Journal from '@/screens/insight/Journal'
import Stats from '@/screens/insight/Stats'
import { uiStore } from '@/stores/uiStore'

export default () => (
  <Router onChange={uiStore.routerOnChange}>
    <Journal path={paths.JOURNAL} />
    <Insights path={paths.INSIGHTS} />
    <Stats path={paths.STATS} />
    <DocScreen path={paths.INSIGHT_DOC + '/:projectId/:id'} />
    <Settings path={paths.INSIGHT_SETTINGS} />
    <Redirect path={'/insight'} to={paths.JOURNAL} />
  </Router>
)

const Redirect = ({ to }: { to: string; path: string }) => {
  useEffect(() => {
    route(to)
  }, [])
  return null
}

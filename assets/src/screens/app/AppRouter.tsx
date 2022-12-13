import Router, { route } from 'preact-router'
import { useEffect } from 'preact/hooks'

import { paths } from '@/config'
import DocScreen from '@/screens/app/DocScreen'
import ProjectsList from '@/screens/app/ProjectsList'
import ProjectView from '@/screens/app/ProjectView'
import Settings from '@/screens/app/Settings'
import TasksList from '@/screens/app/TasksList'
import Today from '@/screens/app/Today'
import Insights from '@/screens/insight/Insights'
import Journal from '@/screens/insight/Journal'
import { uiStore } from '@/stores/uiStore'

export default () => (
  <Router onChange={uiStore.routerOnChange}>
    <Today path={paths.TODAY} />
    <ProjectsList path={paths.PROJECTS} />
    <ProjectView path={paths.PROJECTS + '/:id'} />
    <TasksList path={paths.TASKS} />
    <TasksList path={paths.TASKS + '/:projectId'} />
    <DocScreen path={paths.DOC + '/:projectId/:id'} />
    <Settings path={paths.SETTINGS} />
    <Journal path={paths.DB_JOURNAL} />
    <Insights path={paths.DB_INSIGHTS} />
    <Redirect path={paths.APP} to={paths.TODAY} />
  </Router>
)

const Redirect = ({ to }: { to: string; path: string }) => {
  useEffect(() => {
    route(to)
  }, [])
  return null
}

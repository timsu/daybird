import Router from 'preact-router'

import { paths } from '@/config'
import Dashboard from '@/screens/app/Dashboard'
import DocScreen from '@/screens/app/DocScreen'
import ProjectsList from '@/screens/app/ProjectsList'
import ProjectView from '@/screens/app/ProjectView'
import Settings from '@/screens/app/Settings'
import TasksList from '@/screens/app/TasksList'
import Today from '@/screens/app/Today'
import { uiStore } from '@/stores/uiStore'

export default () => (
  <Router onChange={uiStore.routerOnChange}>
    <Dashboard path={paths.APP} />
    <Today path={paths.TODAY} />
    <ProjectsList path={paths.PROJECTS} />
    <ProjectView path={paths.PROJECTS + '/:id'} />
    <TasksList path={paths.TASKS + '/:projectId'} />
    <DocScreen path={paths.DOC + '/:projectId/:id'} />
    <Settings path={paths.SETTINGS} />
  </Router>
)

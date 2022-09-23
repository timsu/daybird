import Router from 'preact-router'

import { paths } from '@/config'
import Dashboard from '@/screens/app/Dashboard'
import DocScreen from '@/screens/app/DocScreen'
import ProjectsList from '@/screens/app/ProjectsList'
import ProjectView from '@/screens/app/ProjectView'
import TasksList from '@/screens/app/TasksList'
import { uiStore } from '@/stores/uiStore'

export default () => (
  <Router onChange={uiStore.routerOnChange}>
    <Dashboard path={paths.APP} />
    <ProjectsList path={paths.PROJECTS} />
    <ProjectView path={paths.PROJECTS + '/:id'} />
    <TasksList path={paths.TASKS} />
    <DocScreen path={paths.DOC + '/:projectId/:id'} />
  </Router>
)

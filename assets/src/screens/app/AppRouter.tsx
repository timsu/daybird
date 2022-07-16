import Router from 'preact-router'

import { paths } from '@/config'
import Dashboard from '@/screens/app/Dashboard'
import Doc from '@/screens/app/Doc'
import ProjectsList from '@/screens/app/ProjectsList'
import ProjectView from '@/screens/app/ProjectView'

export default () => (
  <Router>
    <Dashboard path={paths.APP} />
    <ProjectsList path={paths.PROJECTS} />
    <ProjectView path={paths.PROJECTS + '/:id'} />
    <Doc path={paths.DOC + '/:filename'} />
  </Router>
)

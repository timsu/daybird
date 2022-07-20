import { Project, Task, User } from '@/models'

export type SuccessResponse = {
  success: boolean
}

export type ErrorResponse = {
  error: {
    message: string
    resend: boolean
  }
}

export type SignInResponse = {
  user?: User
  token?: string
}

export type OAuthSignInResponse = SignInResponse & {
  profile: any
}

export type UserResponse = {
  user: User
}

export type ProjectsResponse = {
  projects: Project[]
  user: User
}

export type ProjectResponse = {
  project: Project
}

export type FilesResponse = {
  files: string[]
}

export type TasksResponse = {
  tasks: Task[]
}

export type TaskResponse = {
  task: Task
}

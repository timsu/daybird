import { DailyNote, File, OAuthToken, Project, ProjectMember, Task, User } from '@/models'

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

export type ProjectWithMembersResponse = ProjectResponse & {
  members: ProjectMember[]
}

export type FilesResponse = {
  files: File[]
}

export type FileResponse = {
  file: File
}

export type TasksResponse = {
  tasks: Task[]
}

export type TaskResponse = {
  task: Task
}

export type OAuthTokenResponse = {
  token: OAuthToken
}

export type OAuthTokensResponse = {
  tokens: OAuthToken[]
}

export type NotesResponse = {
  notes: DailyNote[]
}
export type NoteResponse = {
  note: DailyNote
}

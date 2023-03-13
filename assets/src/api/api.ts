import axios, { AxiosError, AxiosInstance } from 'axios'
import { encode } from 'base64-arraybuffer'

import { config, OAuthProvider } from '@/config'
import {
  AuthToken,
  AuthTokenPair,
  File as LNFile,
  FileType,
  OAuthToken,
  Period,
  Project,
  ProjectRole,
  Task,
  Team,
  User,
} from '@/models'
import { AsyncPromise, logger } from '@/utils'

import * as R from './types'

class APIService {
  endpoint = config.apiUrl

  axios: AxiosInstance = axios

  tokens?: AuthTokenPair

  // token management

  setAuthToken(refreshToken: string) {
    if (refreshToken) {
      return this.exchangeAndSetAuthToken({ refresh: { token: refreshToken } })
    } else {
      return new Promise<AuthTokenPair>((res) => {
        return {}
      })
    }
  }

  clearAuthToken() {
    this.tokens = {}
  }

  setAuthTokens(tokens: AuthTokenPair) {
    if (!tokens?.refresh?.token) {
      logger.warn('No refresh token in tokens -- something went wrong', tokens)
      return
    }

    logger.debug('Setting tokens in API', tokens)
    this.tokens = tokens
    this.axios = axios.create()

    let updating: Promise<void> | null = null

    const refreshTokens = async () => {
      if (!this.tokens?.refresh?.token) {
        logger.error('No refresh token to refresh', this.tokens)
        this.clearAuthToken()
        return
      }

      try {
        updating = AsyncPromise<void>(async (res) => {
          const { token } = this.tokens?.refresh || {}
          if (!token) return
          const newTokens = await this.exchangeToken(token)

          newTokens.refresh = newTokens.refresh || tokens.refresh
          this.tokens = newTokens

          // authActions.updateTokens(newTokens, 'api')
          res()
        })
        await updating
      } finally {
        updating = null
      }
    }

    this.axios.interceptors.request?.use(async (request) => {
      if (updating) await updating

      if (
        !this.tokens?.access?.token ||
        (this.tokens?.refresh?.token != 'guest' && isTokenExpired(this.tokens.access))
      ) {
        await refreshTokens()
      }

      if (request.url?.startsWith(this.endpoint)) {
        if (this.tokens?.access?.token) {
          request.headers!['Authorization'] = 'Bearer ' + this.tokens?.access?.token
        } else {
          delete request.headers!['Authorization']
        }
      }
      return request
    })
  }

  async exchangeAndSetAuthToken(
    { refresh, access }: AuthTokenPair,
    { force, fork }: { force?: boolean; fork?: boolean } = {}
  ): Promise<AuthTokenPair | undefined> {
    if (!refresh) return this.tokens

    if (force || fork || !access || isTokenExpired(access)) {
      const tokens = await this.exchangeToken(refresh.token, fork)
      this.setAuthTokens(tokens)
    } else {
      this.setAuthTokens({ refresh, access })
    }

    return this.tokens
  }

  async exchangeToken(token: string, fork?: boolean): Promise<AuthTokenPair> {
    try {
      const response = await axios.post(`${this.endpoint}/exchange_token`, { token, fork })
      return response.data
    } catch (e: any) {
      logger.error(e)
      if (isAxiosError(e) && e.response?.status === 401) {
        this.clearAuthToken()
      }
      return {}
    }
  }

  // auth
  async signIn(email: string, password: string): Promise<R.SignInResponse> {
    const response = await axios.post(`${this.endpoint}/sign_in`, {
      email,
      password,
    })
    return response.data
  }

  async createAccount(
    name: string,
    email: string,
    password: string,
    invite?: string,
    originType?: string
  ): Promise<R.SignInResponse> {
    const response = await axios.post(`${this.endpoint}/create_account`, {
      name,
      email,
      password,
      invite,
      origin_type: originType,
    })
    return response.data
  }

  async logInElseSignUpOAuth(
    provider: OAuthProvider,
    token: string,
    name?: string,
    email?: string
  ): Promise<R.OAuthSignInResponse> {
    const response = await axios.post(`${this.endpoint}/log_in_else_sign_up_oauth`, {
      provider,
      token,
      name,
      email,
    })
    logger.info('logInElseSignUpOAuth response', response.data)
    return response.data
  }

  async forgotPassword(email: string): Promise<R.SuccessResponse> {
    const response = await axios.post(`${this.endpoint}/forgot_password`, { email })
    return response.data
  }

  async resetPassword(token: string, password: string, code?: string): Promise<R.SignInResponse> {
    const response = await axios.post(`${this.endpoint}/reset_password`, { token, password, code })
    return response.data
  }

  async joinInvite(invite: string): Promise<{ existing: boolean; id: string }> {
    const response = await this.axios.post(`${this.endpoint}/join_invite`, { invite })
    return response.data
  }

  async loginSuccess(code: string, payload?: any): Promise<R.SuccessResponse> {
    const response = await this.axios.post(`${this.endpoint}/login_success`, { code, payload })
    return response.data
  }

  // user management

  async updateUser(updates: Partial<User>): Promise<R.UserResponse> {
    const response = await this.axios.put(`${this.endpoint}/user`, updates)
    return response.data
  }

  async getUser(): Promise<R.UserResponse> {
    const response = await this.axios.get(`${this.endpoint}/user`)
    return response.data
  }

  // projects

  async listProjects(): Promise<R.ProjectsResponse> {
    const response = await this.axios.get(`${this.endpoint}/projects`)
    return response.data
  }

  async getProject(id: string): Promise<R.ProjectWithMembersResponse> {
    const response = await this.axios.get(`${this.endpoint}/projects/${id}`)
    return response.data
  }

  async createProject(project: Partial<Project>): Promise<R.ProjectResponse> {
    const response = await this.axios.post(`${this.endpoint}/projects`, project)
    return response.data
  }

  async updateProject(project: Project, updates: Partial<Project>): Promise<R.ProjectResponse> {
    const response = await this.axios.put(`${this.endpoint}/projects/${project.id}`, updates)
    return response.data
  }

  async projectAddMember(
    project: Project,
    email: string,
    role: ProjectRole
  ): Promise<R.ProjectResponse> {
    const response = await this.axios.post(`${this.endpoint}/projects/${project.id}/add_member`, {
      email,
      role,
    })
    return response.data
  }

  async projectRemoveMember(
    project: Project,
    email: string | undefined,
    user: string | undefined
  ): Promise<R.ProjectResponse> {
    const response = await this.axios.post(
      `${this.endpoint}/projects/${project.id}/remove_member`,
      { email, user }
    )
    return response.data
  }

  // files

  async listFiles(project: Project): Promise<R.FilesResponse> {
    const response = await this.axios.get(`${this.endpoint}/files?project_id=${project.id}`)
    return response.data
  }

  async createFile(
    projectId: string,
    file: { name: string; type: FileType; parent?: string | null }
  ): Promise<R.FileResponse> {
    const response = await this.axios.post(`${this.endpoint}/files?project_id=${projectId}`, file)
    return response.data
  }

  async readFile(project: Project, uuid: string): Promise<any> {
    const response = await this.axios.get(
      `${this.endpoint}/doc?project_id=${project.id}&uuid=${uuid}`
    )
    return response.data
  }

  async writeFile(project: Project, uuid: string, bindata: any): Promise<R.SuccessResponse> {
    const data = new FormData()
    data.append('bindata', encode(bindata.buffer))

    const response = await this.axios.post(
      `${this.endpoint}/doc?project_id=${project.id}&uuid=${uuid}`,
      data,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    )
    return response.data
  }

  async updateFile(
    projectId: string,
    id: string,
    updates: Partial<LNFile>
  ): Promise<R.FileResponse> {
    const response = await this.axios.put(
      `${this.endpoint}/files/${id}?project_id=${projectId}`,
      updates
    )
    return response.data
  }

  // tasks

  async listTasks(project: Project): Promise<R.TasksResponse> {
    const response = await this.axios.get(`${this.endpoint}/tasks?project_id=${project.id}`)
    return response.data
  }

  async createTask(project: Project, task: Partial<Task>): Promise<R.TaskResponse> {
    const response = await this.axios.post(`${this.endpoint}/tasks?project_id=${project.id}`, task)
    return response.data
  }

  async getTask(id: string): Promise<R.TaskResponse> {
    const response = await this.axios.get(`${this.endpoint}/tasks/${id}`)
    return response.data
  }

  async updateTask(id: string, task: Partial<Task>): Promise<R.TaskResponse> {
    const response = await this.axios.put(`${this.endpoint}/tasks/${id}`, task)
    return response.data
  }

  // user data

  async getUserData(key: string, projectId?: string): Promise<any> {
    const projectParam = projectId ? `project=${projectId}&` : ''
    const response = await this.axios.get(
      `${this.endpoint}/users/data?${projectParam}key=${encodeURIComponent(key)}`
    )
    return response.data.data
  }

  async setUserData(key: string, data: any, projectId?: string): Promise<R.SuccessResponse> {
    const projectParam = projectId ? `project=${projectId}&` : ''
    const response = await this.axios.post(
      `${this.endpoint}/users/data?${projectParam}key=${encodeURIComponent(key)}`,
      { data }
    )
    return response.data
  }

  // tokens

  async getOAuthTokens(service: string): Promise<R.OAuthTokensResponse> {
    const response = await this.axios.get(`${this.endpoint}/oauth/token?service=${service}`)
    return response.data
  }

  async connectOAuthToken(
    redirectUri: string,
    code: string,
    service: string
  ): Promise<R.OAuthTokenResponse> {
    const response = await this.axios.post(`${this.endpoint}/oauth/connect`, {
      service,
      code,
      redirect_uri: redirectUri,
    })
    return response.data
  }

  async updateOAuthToken(token: OAuthToken): Promise<R.OAuthTokenResponse> {
    const response = await this.axios.put(
      `${this.endpoint}/oauth/token?service=${token.name}`,
      token
    )
    return response.data
  }

  async refreshOAuthToken(service: string, email: string): Promise<R.OAuthTokenResponse> {
    let response = await this.axios.post(`${this.endpoint}/oauth/refresh`, { service, email })
    return response.data
  }

  async deleteOAuthToken(service: string, email: string): Promise<R.SuccessResponse> {
    const response = await this.axios.delete(
      `${this.endpoint}/oauth/token?service=${service}&email=${email}`
    )
    return response.data
  }

  // storage

  async uploadAttachment(file: File, projectId: string): Promise<{ url: string }> {
    let formData = new FormData()
    formData.append('upload', file)
    const { token } = this.tokens?.access || {}
    if (token) formData.append('token', token)
    if (projectId) formData.append('project_id', projectId)

    const headers = { 'Content-Type': 'multipart/form-data' }
    const response = await this.axios.post(`${this.endpoint}/attachments`, formData, {
      headers: headers,
    })
    return response.data
  }

  // notes

  async listNotes(
    project: Project,
    type: Period,
    start: string,
    end: string
  ): Promise<R.NotesResponse> {
    const response = await this.axios.get(
      `${this.endpoint}/daily_notes?project_id=${project.id}&start=${start}&end=${end}&type=${type}`
    )
    return response.data
  }

  async saveNote(
    project: Project,
    type: Period,
    date: string,
    contents: any,
    snippet: string,
    id?: string
  ): Promise<R.NoteResponse> {
    const response = await this.axios.post(
      `${this.endpoint}/daily_notes/${date}?project_id=${project.id}`,
      {
        type,
        contents,
        snippet,
        id,
      }
    )
    return response.data
  }

  async generateSummary(notes: string): Promise<string> {
    const response = await this.axios.post(`${this.endpoint}/generate/summary`, {
      notes,
    })
    return response.data
  }

  async generateChat(
    messages: { role: string; content: string }[]
  ): Promise<{ response: string; status: number }> {
    const response = await this.axios.post(`${this.endpoint}/generate/addie`, {
      messages,
    })
    return { response: response.data, status: response.status }
  }

  // misc

  async githash(): Promise<{ hash: string }> {
    const response = await this.axios.get(`${this.endpoint}/githash`)
    return response.data
  }

  // for storybooks, put API into a stub state

  stubMode() {
    // disable actual axios by returning unresolved promises
    axios.get = () => new Promise(() => {})
    axios.post = () => new Promise(() => {})
    axios.put = () => new Promise(() => {})
    axios.delete = () => new Promise(() => {})
    this.axios = axios
  }
}

export const API = new APIService()

export const isAxiosError = (item: Error): item is AxiosError => (item as AxiosError).isAxiosError

export const isTokenExpired = (token: AuthToken): boolean | undefined =>
  token?.exp !== undefined && token.exp * 1000 < Date.now() + 500

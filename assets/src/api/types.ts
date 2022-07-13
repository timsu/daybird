import { Team, User } from '@/models'

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

import { createContext } from 'react'

export interface AuthUser {
  uid: string
  email?: string | null
  displayName?: string | null
  role?: string
}

export interface AuthContextValue {
  user: AuthUser | null
  loading: boolean
  isAdmin?: boolean
  login?: (...args: unknown[]) => Promise<void>
  logout?: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue>({ user: null, loading: false, isAdmin: false })
export default AuthContext

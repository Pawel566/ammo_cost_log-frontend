import { useState, useEffect, createContext, useContext } from 'react'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(false) // Set to false for production

  useEffect(() => {
    // In production, we don't have Supabase configured
    // So we just set loading to false immediately
    setLoading(false)
  }, [])

  const signUp = async (email, password, username) => {
    // Mock implementation for production
    return { 
      data: { user: { email, user_metadata: { username } } }, 
      error: null 
    }
  }

  const signIn = async (email, password) => {
    // Mock implementation for production
    return { 
      data: { user: { email, user_metadata: { username: email.split('@')[0] } } }, 
      error: null 
    }
  }

  const signOut = async () => {
    // Mock implementation for production
    return { error: null }
  }

  const value = {
    user,
    loading,
    signUp,
    signIn,
    signOut
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

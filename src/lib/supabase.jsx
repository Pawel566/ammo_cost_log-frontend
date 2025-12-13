import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

let supabase = null;

if (supabaseUrl && supabaseAnonKey && supabaseUrl !== 'https://your-project-id.supabase.co') {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey)
    if (import.meta.env.MODE === 'development') {
      console.log('Supabase client initialized successfully')
    }
  } catch (e) {
    console.error('Failed to initialize Supabase client:', e)
  }
} else {
  // Supabase jest opcjonalny - używany tylko do resetowania hasła
  // Główna autentykacja działa przez backend API
  // Nie logujemy tego jako błąd, ponieważ aplikacja działa bez Supabase
  if (import.meta.env.MODE === 'development') {
    console.info('Supabase not configured (optional). Password reset feature will be unavailable. Main authentication works through backend API.')
  }
  // W produkcji nie logujemy nic - aplikacja działa normalnie bez Supabase
}

export { supabase }

// Auth helper functions
export const auth = {
  async signUp(email, password, username) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username
        }
      }
    })
    return { data, error }
  },

  async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    return { data, error }
  },

  async signOut() {
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser()
    return { user, error }
  },

  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(callback)
  }
}

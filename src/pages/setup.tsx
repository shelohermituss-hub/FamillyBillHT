import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

// PIN creation is now part of the registration flow (register.tsx).
// This route now simply redirects any authenticated user to the dashboard.
export function SetupPage() {
  const navigate = useNavigate()
  useEffect(() => { navigate('/dashboard', { replace: true }) }, [navigate])
  return null
}

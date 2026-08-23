import { useEffect, useState, useCallback } from 'react'
import { fetchProfile, updateProfile } from '@/services/api'
import type { WiseUser } from '@/types'

export function useProfile(userId: string | undefined) {
  const [profile, setProfile] = useState<WiseUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    try {
      const data = await fetchProfile(userId)
      setProfile(data)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }, [userId])

  const update = useCallback(async (updates: Partial<WiseUser>) => {
    if (!userId) return
    await updateProfile(userId, updates)
    await refresh()
  }, [userId, refresh])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { profile, loading, error, refresh, update }
}

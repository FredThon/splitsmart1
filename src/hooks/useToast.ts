'use client'

import { useState, useCallback } from 'react'

interface Toast {
  id: string
  title?: string
  description?: string
  variant?: 'default' | 'destructive'
}

let toastCount = 0

const listeners: Array<(toasts: Toast[]) => void> = []
let memoryState: Toast[] = []

function dispatch(toasts: Toast[]) {
  memoryState = toasts
  listeners.forEach((l) => l(toasts))
}

export function toast({ title, description, variant = 'default' }: Omit<Toast, 'id'>) {
  const id = String(toastCount++)
  const newToast: Toast = { id, title, description, variant }
  dispatch([...memoryState, newToast])

  // Auto-dismiss after 4s
  setTimeout(() => {
    dispatch(memoryState.filter((t) => t.id !== id))
  }, 4000)

  return id
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>(memoryState)

  const subscribe = useCallback(() => {
    listeners.push(setToasts)
    return () => {
      const idx = listeners.indexOf(setToasts)
      if (idx > -1) listeners.splice(idx, 1)
    }
  }, [])

  // Subscribe on mount
  useState(() => {
    const unsub = subscribe()
    return unsub
  })

  return { toasts, toast }
}

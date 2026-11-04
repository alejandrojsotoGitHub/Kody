import { create } from 'zustand'

export type Mood = 'idle' | 'happy' | 'sleep' | 'thinking' | 'listening' | 'talking' | 'alert'

interface KodyState {
  mood: Mood
  base: Mood
  bubble: string
  react: (mood: Mood, bubble?: string, ms?: number) => void
  setBase: (mood: Mood) => void
}

let timer: ReturnType<typeof setTimeout> | undefined

export const useKody = create<KodyState>((set, get) => ({
  mood: 'idle',
  base: 'idle',
  bubble: '',
  react: (mood, bubble = '', ms = 2600) => {
    clearTimeout(timer)
    set({ mood, bubble })
    timer = setTimeout(() => set({ mood: get().base, bubble: '' }), ms)
  },
  setBase: (base) => set({ base, mood: base }),
}))

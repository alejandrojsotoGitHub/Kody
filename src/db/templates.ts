import type { Routine } from './schema'

interface Template {
  routines: { name: string; slot: Routine['slot']; days?: number[]; steps: string[] }[]
  habits: { name: string; icon: string }[]
  tasks: string[]
}

export const TEMPLATES: Record<string, Template> = {
  Universidad: {
    routines: [{ name: 'Estudio diario', slot: 'tarde', days: [1, 2, 3, 4, 5], steps: ['Repasar apuntes', 'Avanzar tarea pendiente', 'Planificar mañana'] }],
    habits: [{ name: 'Leer 20 minutos', icon: '📚' }],
    tasks: ['Revisar syllabus y fechas de entrega'],
  },
  Iglesia: {
    routines: [{ name: 'Devocional', slot: 'mañana', steps: ['Oración', 'Lectura bíblica', 'Reflexión'] }],
    habits: [{ name: 'Orar', icon: '🙏' }],
    tasks: ['Preparar actividad de la semana'],
  },
  Emprendimiento: {
    routines: [{ name: 'Bloque de emprendimiento', slot: 'día', days: [1, 2, 3, 4, 5, 6], steps: ['Revisar metas', 'Trabajo profundo (1h)', 'Seguimiento a clientes'] }],
    habits: [{ name: 'Avanzar 1 hora', icon: '🚀' }],
    tasks: ['Definir propuesta de valor'],
  },
}

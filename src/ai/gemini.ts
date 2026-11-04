import { db, uid, type Project } from '../db/schema'
import { addProject, addTask, toggleTask } from '../db/actions'
import { ALL_DAYS, ymd } from '../lib/dates'
import { getPrefs } from '../db/settings'
import { useFocus } from '../lib/focusStore'
import { device, errorText, isNative } from '../native/device'
import type { Prefs } from '../db/settings'

type Part = { text?: string; functionCall?: { name: string; args: Record<string, unknown> }; functionResponse?: { name: string; response: unknown } }
type Content = { role: 'user' | 'model'; parts: Part[] }

const S = (description: string) => ({ type: 'STRING', description })
const TOOLS = [{
  functionDeclarations: [
    { name: 'crear_tarea', description: 'Crea una tarea pendiente.', parameters: { type: 'OBJECT', properties: { titulo: S('Título'), fecha: S('Fecha límite yyyy-MM-dd'), prioridad: { type: 'INTEGER', description: '1 alta, 2 media, 3 baja' }, minutos: { type: 'INTEGER', description: 'Tiempo estimado en minutos' }, secciones: { type: 'ARRAY', items: { type: 'STRING' }, description: 'Partes en que se divide la tarea' }, proyecto: S('Nombre de un proyecto existente') }, required: ['titulo'] } },
    { name: 'guardar_contexto_proyecto', description: 'Agrega información de contexto a un proyecto existente (metas, fechas, reglas).', parameters: { type: 'OBJECT', properties: { proyecto: S('Nombre del proyecto'), texto: S('Contexto a guardar') }, required: ['proyecto', 'texto'] } },
    { name: 'completar_tarea', description: 'Marca como hecha una tarea pendiente buscándola por título.', parameters: { type: 'OBJECT', properties: { titulo: S('Título o parte del título') }, required: ['titulo'] } },
    { name: 'crear_proyecto', description: 'Crea un proyecto. Si es Universidad, Iglesia o Emprendimiento se llena con rutinas y hábitos de plantilla.', parameters: { type: 'OBJECT', properties: { nombre: S('Nombre'), area: S('Universidad, Iglesia, Emprendimiento o Personal') }, required: ['nombre'] } },
    { name: 'crear_evento', description: 'Agrega un evento o recordatorio al calendario.', parameters: { type: 'OBJECT', properties: { titulo: S('Título'), fecha: S('yyyy-MM-dd'), hora: S('HH:mm 24h'), recordar_minutos: { type: 'INTEGER', description: 'Minutos antes para avisar' }, proyecto: S('Proyecto existente') }, required: ['titulo', 'fecha'] } },
    { name: 'crear_rutina', description: 'Crea una rutina diaria con pasos.', parameters: { type: 'OBJECT', properties: { nombre: S('Nombre'), momento: S('mañana, día, tarde o noche'), pasos: { type: 'ARRAY', items: { type: 'STRING' }, description: 'Pasos' }, proyecto: S('Proyecto existente') }, required: ['nombre', 'pasos'] } },
    { name: 'crear_habito', description: 'Crea un hábito diario a seguir.', parameters: { type: 'OBJECT', properties: { nombre: S('Nombre'), icono: S('Un emoji'), proyecto: S('Proyecto existente') }, required: ['nombre'] } },
  ],
}]

const FOCUS_TOOL = { name: 'iniciar_enfoque', description: 'Inicia una sesión de enfoque (pomodoro) y, en el teléfono Android, activa No Molestar y el bloqueo de apps distractoras.', parameters: { type: 'OBJECT', properties: { minutos: { type: 'INTEGER', description: 'Duración, 5 a 180' }, tarea: S('Título de una tarea pendiente en la que enfocarse') } } }
const DEVICE_TOOLS = [
  { name: 'activar_no_molestar', description: 'Activa o desactiva el modo No Molestar del teléfono.', parameters: { type: 'OBJECT', properties: { activar: { type: 'BOOLEAN', description: 'true para activar, false para desactivar' }, minutos: { type: 'INTEGER', description: 'Desactivarlo solo tras estos minutos' } }, required: ['activar'] } },
  { name: 'abrir_app', description: 'Abre una app instalada en el teléfono por su nombre.', parameters: { type: 'OBJECT', properties: { nombre: S('Nombre de la app, ej. WhatsApp') }, required: ['nombre'] } },
]

/** Antes de actuar sobre el teléfono, pide confirmación al usuario (configurable en Ajustes). */
async function confirmAction(msg: string) {
  const p = await getPrefs()
  return p.confirmDeviceActions ? window.confirm(`Kody quiere: ${msg}\n\n¿Permitir?`) : true
}

const AREA_COLORS: Record<string, string> = { Universidad: '#38bdf8', Iglesia: '#fbbf24', Emprendimiento: '#34d399', Personal: '#c084fc' }

function findProject(projects: Project[], name?: unknown) {
  const n = String(name ?? '').toLowerCase().trim()
  return n ? projects.find((p) => p.name.toLowerCase().includes(n)) : undefined
}

async function run(name: string, a: Record<string, unknown>): Promise<unknown> {
  const projects = await db.projects.toArray()
  const proj = findProject(projects, a.proyecto)
  switch (name) {
    case 'iniciar_enfoque': {
      if (useFocus.getState().endAt) return { ok: false, error: 'Ya hay un enfoque en curso' }
      const min = Math.min(180, Math.max(5, Number(a.minutos ?? 25)))
      const task = a.tarea ? (await db.tasks.toArray()).find((t) => !t.done && t.title.toLowerCase().includes(String(a.tarea).toLowerCase())) : undefined
      if (!(await confirmAction(`iniciar un enfoque de ${min} min${task ? ` en "${task.title}"` : ''}`))) return { ok: false, error: 'El usuario canceló la acción' }
      useFocus.getState().start(min, task?.id ?? '', task?.projectId ?? '')
      return { ok: true, minutos: min }
    }
    case 'activar_no_molestar': {
      if (!isNative) return { ok: false, error: 'Solo funciona en la app Android' }
      const on = a.activar !== false
      if (!(await confirmAction(on ? 'activar No Molestar' : 'desactivar No Molestar'))) return { ok: false, error: 'El usuario canceló la acción' }
      try {
        const p = await getPrefs()
        await device.setDnd(on, p.dndMode, on && a.minutos ? Date.now() + Number(a.minutos) * 60000 : undefined)
        return { ok: true }
      } catch (e) { return { ok: false, error: errorText(e) } }
    }
    case 'abrir_app': {
      if (!isNative) return { ok: false, error: 'Solo funciona en la app Android' }
      const q = String(a.nombre ?? '').toLowerCase().trim()
      const apps = await device.getInstalledApps()
      const app = apps.find((x) => x.label.toLowerCase() === q) ?? apps.find((x) => x.label.toLowerCase().includes(q))
      if (!app) return { ok: false, error: 'No encontré esa app instalada' }
      if (!(await confirmAction(`abrir ${app.label}`))) return { ok: false, error: 'El usuario canceló la acción' }
      try { await device.openApp(app.pkg); return { ok: true, app: app.label } } catch (e) { return { ok: false, error: errorText(e) } }
    }
    case 'crear_tarea':
      await addTask({ title: String(a.titulo), dueDate: a.fecha ? String(a.fecha) : undefined, priority: ([1, 2, 3].includes(Number(a.prioridad)) ? Number(a.prioridad) : 2) as 1 | 2 | 3, projectId: proj?.id, source: 'ia', estimateMin: a.minutos ? Number(a.minutos) : undefined, subtasks: ((a.secciones as string[]) ?? []).map((title) => ({ id: uid(), title: String(title), done: false })) })
      return { ok: true, proyecto: proj?.name ?? null }
    case 'guardar_contexto_proyecto': {
      if (!proj) return { ok: false, error: 'No encontré ese proyecto' }
      await db.projects.update(proj.id, { context: [proj.context, String(a.texto)].filter(Boolean).join('\n') })
      return { ok: true }
    }
    case 'completar_tarea': {
      const t = (await db.tasks.toArray()).find((x) => !x.done && x.title.toLowerCase().includes(String(a.titulo).toLowerCase()))
      if (!t) return { ok: false, error: 'No encontré esa tarea pendiente' }
      await toggleTask(t)
      return { ok: true, tarea: t.title }
    }
    case 'crear_proyecto': {
      const area = String(a.area ?? 'Personal')
      await addProject(String(a.nombre), area, AREA_COLORS[area] ?? '#c084fc', ['Universidad', 'Iglesia', 'Emprendimiento'].includes(area) ? area : '')
      return { ok: true }
    }
    case 'crear_evento':
      await db.events.add({ id: uid(), title: String(a.titulo), date: String(a.fecha), time: a.hora ? String(a.hora) : undefined, remindMinutes: a.recordar_minutos ? Number(a.recordar_minutos) : 10, projectId: proj?.id, createdAt: Date.now() })
      return { ok: true }
    case 'crear_rutina': {
      const slots = ['mañana', 'día', 'tarde', 'noche']
      const slot = slots.includes(String(a.momento)) ? (String(a.momento) as 'mañana') : 'mañana'
      const steps = ((a.pasos as string[]) ?? []).map((title) => ({ id: uid(), title: String(title) }))
      await db.routines.add({ id: uid(), name: String(a.nombre), slot, days: ALL_DAYS, projectId: proj?.id, steps, createdAt: Date.now() })
      return { ok: true }
    }
    case 'crear_habito':
      await db.habits.add({ id: uid(), name: String(a.nombre), icon: String(a.icono ?? '✨'), color: proj?.color ?? '#5eead4', days: ALL_DAYS, projectId: proj?.id, createdAt: Date.now() })
      return { ok: true }
  }
  return { ok: false, error: 'Función desconocida' }
}

async function buildContext(prefs: Prefs) {
  const today = ymd()
  const [projects, tasks, events, habits] = await Promise.all([db.projects.toArray(), db.tasks.toArray(), db.events.toArray(), db.habits.toArray()])
  const pend = tasks.filter((t) => !t.done).slice(0, 25).map((t) => `- ${t.title}${t.dueDate ? ` (vence ${t.dueDate})` : ''}${t.estimateMin ? ` ~${t.estimateMin}min` : ''}${t.projectId ? ` [${projects.find((p) => p.id === t.projectId)?.name}]` : ''}`)
  const ev = events.filter((e) => e.date >= today).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 12).map((e) => `- ${e.date} ${e.time ?? ''} ${e.title}`)
  const tone = { amigable: 'cercano, cálido y breve', formal: 'formal y preciso', jarvis: 'estilo J.A.R.V.I.S.: elegante, eficiente, con ligero humor británico' }[prefs.tone]
  return `Eres Kody, el asistente personal de ${prefs.userName || 'tu usuario'}, un robot de código y tecnología. Responde en español, con tono ${tone}. Sé conciso. Cuando el usuario pida crear o cambiar algo, USA las funciones disponibles en vez de solo decir que lo harás, y luego confirma en una frase.
Fecha y hora actual: ${today} ${new Date().toTimeString().slice(0, 5)}.
Proyectos:\n${projects.map((p) => `- ${p.name} (${p.area})${p.context ? `: ${p.context.slice(0, 400)}` : ''}`).join('\n') || 'ninguno'}
Hábitos: ${habits.map((h) => h.name).join(', ') || 'ninguno'}.
Tareas pendientes:\n${pend.join('\n') || '(ninguna)'}
Próximos eventos:\n${ev.join('\n') || '(ninguno)'}`
}

/** Modelos que la key confirmó como disponibles; se prueban en orden si uno está saturado. */
export const GEMINI_MODELS = ['gemini-3.5-flash', 'gemini-3.7-flash', 'gemini-3.6-flash', 'gemini-3.5-flash-lite', 'gemini-3.1-flash-lite', 'gemini-3.8-flash']
const RETRYABLE = [429, 500, 502, 503, 504, 404]

function friendly(status: number, msg: string) {
  if (status === 400 && /api key/i.test(msg)) return 'La API key no es válida. Revísala en Ajustes → IA.'
  if (status === 401 || status === 403) return 'Google rechazó la API key (sin permiso). Genera una nueva en aistudio.google.com.'
  if (status === 429) return 'Se alcanzó el límite gratuito de Gemini. Espera un minuto e intenta de nuevo.'
  if (status === 503) return 'Los modelos de Gemini están saturados ahora mismo. Intenta de nuevo en unos segundos.'
  return msg || `Error de Gemini (${status})`
}

async function callModel(model: string, key: string, body: string) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`
  const init: RequestInit = { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key }, body }
  let res = await fetch(url, init)
  if (res.status === 503 || res.status === 429) {
    await new Promise((ok) => setTimeout(ok, 1200))
    res = await fetch(url, init)
  }
  return res
}

/** Prueba cada modelo hasta que uno responda. Devuelve la respuesta y el modelo usado. */
async function generate(prefs: Prefs, body: string) {
  const order = [prefs.geminiModel, ...GEMINI_MODELS].filter((m, i, a) => m && a.indexOf(m) === i)
  let last: { status: number; msg: string } = { status: 0, msg: '' }
  for (const model of order) {
    let res: Response
    try {
      res = await callModel(model, prefs.geminiKey, body)
    } catch {
      throw new Error('No hay conexión con Google. Revisa tu internet.')
    }
    if (res.ok) return { data: await res.json(), model }
    const err = await res.json().catch(() => ({}))
    last = { status: res.status, msg: err?.error?.message ?? '' }
    if (!RETRYABLE.includes(res.status)) break
  }
  throw new Error(friendly(last.status, last.msg))
}

export async function testGemini(prefs: Prefs): Promise<string> {
  if (!prefs.geminiKey) throw new Error('Pega primero tu API key.')
  const { model } = await generate(prefs, JSON.stringify({ contents: [{ role: 'user', parts: [{ text: 'Responde solo: OK' }] }] }))
  return model
}

export async function askKody(history: { role: 'user' | 'model'; text: string }[], prefs: Prefs): Promise<string> {
  if (!prefs.geminiKey) throw new Error('Falta tu API key de Gemini. Pégala en Ajustes → IA (es gratis en aistudio.google.com).')
  const contents: Content[] = history.slice(-16).map((m) => ({ role: m.role, parts: [{ text: m.text }] }))
  const system = await buildContext(prefs)
  for (let i = 0; i < 5; i++) {
    const { data } = await generate(prefs, JSON.stringify({ systemInstruction: { parts: [{ text: system }] }, contents, tools: [{ functionDeclarations: [...TOOLS[0].functionDeclarations, FOCUS_TOOL, ...(isNative ? DEVICE_TOOLS : [])] }] }))
    const parts: Part[] = data.candidates?.[0]?.content?.parts ?? []
    const calls = parts.filter((p) => p.functionCall)
    if (!calls.length) return parts.filter((p) => !(p as { thought?: boolean }).thought).map((p) => p.text ?? '').join('').trim() || '…'
    contents.push({ role: 'model', parts })
    const responses: Part[] = []
    for (const c of calls) {
      const out = await run(c.functionCall!.name, c.functionCall!.args ?? {}).catch((e) => ({ ok: false, error: String(e) }))
      responses.push({ functionResponse: { name: c.functionCall!.name, response: out as object } })
    }
    contents.push({ role: 'user', parts: responses })
  }
  return 'Hecho.'
}

import { db, TABLES, type TableName } from './schema'

export const BACKUP_VERSION = 1

export interface KodyBackup {
  app: 'kody'
  version: number
  exportedAt: string
  data: Record<TableName, unknown[]>
}

/** Secretos que el usuario puede excluir del respaldo. */
const SECRET_KEYS = ['geminiKey', 'backendToken']

export async function buildBackup(includeSecrets: boolean): Promise<KodyBackup> {
  const data = {} as Record<TableName, unknown[]>
  for (const t of TABLES) {
    let rows = await db.table(t).toArray()
    if (t === 'settings' && !includeSecrets) {
      rows = rows.filter((r) => !SECRET_KEYS.includes(r.key))
    }
    data[t] = rows
  }
  return { app: 'kody', version: BACKUP_VERSION, exportedAt: new Date().toISOString(), data }
}

export async function exportToFile(includeSecrets: boolean): Promise<void> {
  const backup = await buildBackup(includeSecrets)
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
  const stamp = new Date().toISOString().slice(0, 10)
  const file = new File([blob], `kody-respaldo-${stamp}.json`, { type: 'application/json' })

  // En Android/móvil: hoja de compartir (guardar en Drive, WhatsApp, etc.)
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: 'Respaldo de Kody' })
      return
    } catch (e) {
      if ((e as Error).name === 'AbortError') return
    }
  }
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = file.name
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}

export function validateBackup(raw: unknown): KodyBackup {
  const b = raw as KodyBackup
  if (!b || b.app !== 'kody' || typeof b.version !== 'number' || typeof b.data !== 'object') {
    throw new Error('Este archivo no es un respaldo válido de Kody.')
  }
  if (b.version > BACKUP_VERSION) {
    throw new Error('El respaldo es de una versión más nueva de Kody. Actualiza la app.')
  }
  for (const t of TABLES) {
    if (b.data[t] !== undefined && !Array.isArray(b.data[t])) {
      throw new Error(`Tabla corrupta en el respaldo: ${t}`)
    }
  }
  return b
}

/** mode 'reemplazar' borra todo y carga; 'fusionar' agrega/actualiza por id sin borrar. */
export async function importBackup(
  raw: unknown,
  mode: 'reemplazar' | 'fusionar',
): Promise<Record<string, number>> {
  const backup = validateBackup(raw)
  const counts: Record<string, number> = {}
  await db.transaction('rw', TABLES.map((t) => db.table(t)), async () => {
    for (const t of TABLES) {
      const rows = backup.data[t] ?? []
      const table = db.table(t)
      if (mode === 'reemplazar') {
        // conserva los secretos locales si el respaldo no los trae
        if (t === 'settings') {
          const keep = (await table.toArray()).filter((r) => SECRET_KEYS.includes(r.key))
          await table.clear()
          await table.bulkPut(keep)
        } else {
          await table.clear()
        }
      }
      await table.bulkPut(rows)
      counts[t] = rows.length
    }
  })
  return counts
}

export async function importFromFile(file: File, mode: 'reemplazar' | 'fusionar') {
  let json: unknown
  try {
    json = JSON.parse(await file.text())
  } catch {
    throw new Error('El archivo no es un JSON válido.')
  }
  return importBackup(json, mode)
}

export async function wipeAll(): Promise<void> {
  await db.transaction('rw', TABLES.map((t) => db.table(t)), async () => {
    for (const t of TABLES) await db.table(t).clear()
  })
}

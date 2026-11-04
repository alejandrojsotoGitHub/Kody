import { Capacitor, registerPlugin, type PluginListenerHandle } from '@capacitor/core'

/** true solo dentro de la app Android; en el navegador todo esto degrada a "no disponible". */
export const isNative = Capacitor.isNativePlatform()

export interface DeviceStatus {
  dnd: boolean
  usage: boolean
  accessibility: boolean
  microphone: boolean
  speech: boolean
}
export interface AppInfo { pkg: string; label: string }
export interface UsageApp extends AppInfo { ms: number }
export interface Usage { totalMs: number; apps: UsageApp[] }
export type SettingsTarget = 'dnd' | 'usage' | 'accessibility' | 'notifications' | 'alarms' | 'app'

interface KodyDevicePlugin {
  getStatus(): Promise<DeviceStatus>
  openSettings(o: { type: SettingsTarget }): Promise<void>
  setDnd(o: { enabled: boolean; mode?: string; untilMs?: number }): Promise<void>
  getUsage(o: { days: number }): Promise<Usage>
  getInstalledApps(): Promise<{ apps: AppInfo[] }>
  openApp(o: { pkg: string }): Promise<void>
  setBlocking(o: { enabled: boolean; packages: string[]; untilMs?: number }): Promise<void>
  startListening(o: { language?: string }): Promise<void>
  stopListening(): Promise<void>
  cancelListening(): Promise<void>
  addListener(event: string, fn: (data: { text?: string; error?: string }) => void): Promise<PluginListenerHandle>
}

const plugin = isNative ? registerPlugin<KodyDevicePlugin>('KodyDevice') : null

const EMPTY_STATUS: DeviceStatus = { dnd: false, usage: false, accessibility: false, microphone: false, speech: false }

/** Mensaje amable cuando falta un permiso que el usuario debe conceder en Android. */
export const NEEDS_PERMISSION = 'NO_PERMISSION'

export const device = {
  getStatus: async (): Promise<DeviceStatus> => (plugin ? plugin.getStatus() : EMPTY_STATUS),
  openSettings: async (type: SettingsTarget) => { await plugin?.openSettings({ type }) },
  setDnd: async (enabled: boolean, mode = 'priority', untilMs?: number) => { await plugin?.setDnd({ enabled, mode, untilMs }) },
  getUsage: async (days: number): Promise<Usage> => (plugin ? plugin.getUsage({ days }) : { totalMs: 0, apps: [] }),
  getInstalledApps: async (): Promise<AppInfo[]> => (plugin ? (await plugin.getInstalledApps()).apps : []),
  openApp: async (pkg: string) => { await plugin?.openApp({ pkg }) },
  setBlocking: async (enabled: boolean, packages: string[], untilMs?: number) => { await plugin?.setBlocking({ enabled, packages, untilMs }) },
  startListening: async (language = 'es-MX') => { await plugin?.startListening({ language }) },
  stopListening: async () => { await plugin?.stopListening() },
  cancelListening: async () => { await plugin?.cancelListening() },
  on: async (event: string, fn: (d: { text?: string; error?: string }) => void) => plugin?.addListener(event, fn),
}

export const errorText = (e: unknown) => ((e as Error)?.message === NEEDS_PERMISSION ? 'Falta conceder el permiso en Ajustes → Teléfono.' : (e as Error)?.message ?? 'Error desconocido')

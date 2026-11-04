import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'app.kody.assistant',
  appName: 'Kody',
  webDir: 'dist',
  android: { allowMixedContent: false },
}

export default config

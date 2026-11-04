# Kody

Tu asistente personal tipo Jarvis: **proyectos, rutinas, tareas, calendario, hábitos, enfoque, analíticas y un chat con IA** conectados entre sí. Funciona **100 % local** en tu teléfono (los datos viven en el dispositivo) con estética glassmorphism y una mascota que cambia con el tema.

## Instalarla en el teléfono (Android)

1. Abre la dirección de la app en **Chrome**: `https://<tu-usuario>.github.io/<repo>/`
2. Menú ⋮ → **Instalar app** (o *Añadir a pantalla de inicio*).
3. Ábrela desde el ícono. Funciona sin conexión (la IA y el dictado por voz sí necesitan internet).

> El micrófono y la instalación solo funcionan sobre **HTTPS**, por eso se publica en GitHub Pages.

## Activar el chat con IA (gratis)

1. Crea una API key en <https://aistudio.google.com/apikey>.
2. En Kody: **Más → Ajustes → IA · Gemini** → pega la key → *Probar conexión*.

La key se guarda solo en tu dispositivo y **nunca se sube a este repositorio**. Kody prueba varios modelos de Gemini automáticamente si uno está saturado.

## Cambiar de teléfono / respaldar

**Ajustes → Datos · respaldo**: *Exportar datos* genera un `.json` con todo (proyectos, tareas, hábitos, chat, ajustes). En el teléfono nuevo usa *Importar respaldo* (fusionar o reemplazar). Por defecto la API key **no** se incluye.

## Desarrollo

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # compila a dist/
node scripts/make-icons.mjs   # regenera los íconos
```

Despliegue: cada push a `main` publica en GitHub Pages (`.github/workflows/pages.yml`). En el repo: **Settings → Pages → Source: GitHub Actions**.

## Stack

React + Vite + TypeScript · Dexie (IndexedDB) · Framer Motion · Recharts · PWA (vite-plugin-pwa) · Capacitor (app Android nativa, en camino) · Gemini API.

## Hoja de ruta

- App Android nativa (APK): No Molestar, tiempo de uso, bloqueo de apps en modo Enfoque, alarmas con la app cerrada.
- Backend opcional (proxy de IA y sincronización cifrada).

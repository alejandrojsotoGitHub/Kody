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

## App Android (APK) — control del teléfono

El APK suma lo que un navegador no puede hacer:

| Función | Qué hace | Permiso (lo concedes una vez) |
|---|---|---|
| **No Molestar** | Se activa solo durante un enfoque y vuelve a como estaba al terminar (incluso con la app cerrada) | Acceso a No Molestar |
| **Bloqueo de apps** | Si abres una app distractora durante un enfoque, te devuelve al inicio | Servicio de Accesibilidad de Kody |
| **Tiempo de uso** | Cuánto usas cada app (Analíticas) | Acceso al uso |
| **Recordatorios** | Avisos del calendario con la app cerrada | Notificaciones y alarmas |
| **Dictado por voz** | Reconocedor de voz de Android | Micrófono |
| **Kody (IA)** | Puede activar No Molestar, abrir apps e iniciar enfoques (pide confirmación) | — |

**Obtener el APK:** en GitHub → pestaña **Actions** → *Compilar APK (Android)* → último run → artefacto **kody-apk**. Descomprime e instala `app-debug.apk` (permite instalar apps de orígenes desconocidos).

**Primer uso:** abre **Más → Ajustes → Permisos del teléfono** y pulsa *Conceder* en cada uno. En Android 13+, para el bloqueo de apps primero entra en *Ajustes del teléfono → Apps → Kody → ⋮ → Permitir ajustes restringidos*, y luego activa Kody en *Accesibilidad*.

Compilar localmente: JDK 21 + Android SDK 36, y luego `npm run build && npx cap sync android && cd android && ./gradlew assembleDebug`.

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

- Backend opcional (proxy de IA y sincronización cifrada).

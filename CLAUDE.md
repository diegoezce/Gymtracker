# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # servidor de desarrollo (Vite HMR)
npm run build        # build de producción → dist/
npm run preview      # sirve dist/ localmente
npm test             # vitest run (una pasada, sin watch)
npm run test:watch   # vitest en modo watch
```

Para correr un solo test:
```bash
npx vitest run src/domain/progression.test.js
```

## Arquitectura

PWA mobile-first sin backend. Todo el estado vive en `localStorage` bajo la clave `gym:estado:v1` (ver `src/storage/index.js`).

### Flujo de datos

```
RUTINA_INICIAL (rutina.js)
      ↓ solo si no hay dato guardado
App.jsx  ←→  storage (localStorage)
      ↓
  días[]  →  Sesion →  guardarSerie → progresar() / aprender()
                                           ↓
                                    días[] actualizado → storage
```

### Modelo de datos central

Cada ejercicio tiene esta forma (definida en `src/domain/rutina.js`):
```js
{
  id, nombre, peso, incremento, series,
  repsMin, repsMax,       // rango de reps (ej: 8 y 10)
  repsObjetivo,           // target actual, arranca en repsMin
  descanso,               // segundos de descanso entre series
  ajustes, historial      // historial: últimas 40 sesiones [{ fecha, series[] }]
}
```

### Capa de persistencia (StorageAdapter)

`src/storage/StorageAdapter.js` define el contrato `{ get(key), set(key, value) }` — ambos async. El único adapter implementado es `localStorageAdapter`. Para migrar a un backend remoto o IndexedDB basta con crear otro adapter y exportarlo desde `src/storage/index.js` sin tocar el resto de la app.

### Lógica de progresión (`src/domain/progression.js`)

- `progresar(ej, seriesHechas)` — calcula el peso y `repsObjetivo` para la próxima sesión:
  - Con `repsMax`: si todas las series alcanzan `repsMax` → sube `incremento` y vuelve a `repsMin`. Dos sesiones al fallo seguidas → baja el peso.
  - Sin `repsMax` (legado): basado en RIR de la última serie.
- `aprender(ej, pesoUsado)` — detecta si el usuario le pisa la sugerencia de peso 3 veces seguidas en la misma dirección y recalibra el `incremento`.

### Pantallas y navegación

`App.jsx` maneja el estado global y la navegación mediante un string `pantalla` ("inicio" | "ajustes" | "historial"). No hay router.

| Pantalla | Componente | Cuándo se muestra |
|---|---|---|
| Inicio | `Inicio.jsx` | Default |
| Sesión activa | `Sesion.jsx` | Cuando `sesion !== null` (tiene prioridad) |
| Progreso | `Progreso.jsx` | `pantalla === "historial"` |
| Ajustes | `Ajustes.jsx` | `pantalla === "ajustes"` |

### Timer de descanso

Vive en `Sesion.jsx` como estado local. Se activa automáticamente al guardar una serie (si quedan más series del mismo ejercicio). Usa `navigator.vibrate` para feedback haptico. Mientras el timer corre, oculta el formulario de registro de la siguiente serie.

## Estilo y tema

Sin CSS externo ni Tailwind — todo inline styles. Paleta y tipografía centralizadas en `src/theme.js` (`C.sodio`, `C.hueso`, `C.gris`, etc.). Helpers de estilos reutilizables en `src/styles/helpers.js`.

## Despliegue

Railway sirve el build estático con `serve -s dist`. El puerto lo inyecta Railway via `$PORT`. No hay servidor Node propio.

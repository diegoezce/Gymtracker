# Gymtracker en el App Store — plan

Estado: **planificado, sin empezar.** Última actualización: 2026-11-20.

Proyecto de mediano plazo. La PWA sigue siendo la app de uso diario y no se
toca su funcionalidad; la nativa es para publicar en el App Store.

---

## La decisión que define todo: la app del Store es local-only

El motor del proyecto no es técnico, es publicar y obtener alguna ganancia.
Eso cambia qué hay que construir primero.

**El problema:** la app de hoy depende de `hm.sparkio.me` y tiene login contra
un backend donde sólo existe un usuario. Un revisor de Apple no puede pasar de
la pantalla de login. Rechazo seguro por **4.2** (funcionalidad mínima) y
**5.1.1** (si hay cuentas, tiene que haber alta y borrado de cuenta desde la
app).

Resolverlo con registro público es peor: pasás a operar infraestructura para
desconocidos — uptime, backups, datos de salud ajenos en la miniPC detrás de un
túnel — por una ganancia marginal.

**La salida, que ya está construida:** la PWA funciona entera sin backend. Todo
vive en `localStorage` y la sync con HM es opcional.

> **La app del Store es la app menos la sync.** Local-only, sin login, sin
> servidor. Cero infraestructura, cero obligaciones de privacidad de datos
> ajenos, y nada que Apple pueda objetar.

La sync con HM queda como función personal: vive en el build propio, o detrás de
un flag que no se compila para el Store. La PWA se sigue usando como siempre,
con sync incluida.

### Cómo se escala después, y qué cuesta cada paso

| Camino | Costo | Cuándo |
|---|---|---|
| **iCloud / CloudKit** | Bajo. Sincroniza entre dispositivos con la misma Apple ID. Sin servidor, sin cuentas, sin alta ni baja. Apple no pide nada extra. | Si hace falta "mi rutina en iPhone y iPad" |
| **Cuentas + backend propio** | Alto. Entra 5.1.1 completo: registro, borrado de cuenta, Sign in with Apple si hay login de terceros, política de privacidad real, y hospedar datos de salud ajenos. | Sólo si el producto lo pide y hay usuarios que lo justifiquen |

Lo que ya protege esta decisión: `StorageAdapter` (`src/storage/`) es un contrato
`{ get, set }` async pensado justo para cambiar de backend sin tocar el resto. El
dominio no sabe dónde viven los datos.

**Anotado para el futuro, no hacer ahora:** hoy todo el estado es un único blob
JSON (`gym:estado:v1`). Local funciona perfecto. El día de CloudKit conviene que
sea por registro, porque un blob único sincroniza con "gana el último que
escribió" y se pierden cambios. Es migrable — el dominio no se entera — pero es
trabajo real.

**Conservar desde el día uno:** exportar e importar rutina, que ya existe en
Ajustes. Es la red de seguridad mientras no haya sync, y le da control de sus
datos al usuario sin que nadie opere nada.

---

## El stack ya está resuelto

`healthmonitor/health-monitor-ios` es una app Expo/React Native en producción
contra el mismo backend Django:

```
Expo ~57 · RN 0.86 · React 19 · TypeScript
EAS Build (perfiles development / preview / production + submit)
bundleIdentifier: me.sparkio.healthmonitor
HealthKit vía react-native-health · AsyncStorage para el token
```

Los dos obstáculos típicos ya están pagados: **EAS compila en la nube, así que no
hace falta Xcode local**, y el pipeline de firma y distribución al iPhone ya
funciona. La cuenta de Apple Developer ya existe.

---

## Qué se reusa de la PWA

Medido sobre `src/` (sin tests), a 2026-11-20:

| Capa | Líneas | Al pasar a React Native |
|---|---:|---|
| `domain/` | 1353 | **Tal cual.** Es JS puro |
| `sync/` | 522 | Casi tal cual (`fetch` existe). No va al build del Store |
| `storage/` | 110 | Se reescribe (AsyncStorage / FileSystem) |
| `App.jsx` | 541 | La lógica se porta; la navegación cambia |
| `components/` | 4597 | **Se reescribe entero** (son inline styles sobre DOM) |

Los **274 tests vienen gratis**: prueban el dominio, no la UI.

Única excepción en el dominio: `imagen.js` usa `canvas` / `createImageBitmap`
para achicar fotos. Sólo la función `achicar()`; el resto del módulo es puro.
En RN eso pasa a `expo-image-manipulator`.

---

## Estructura: monorepo, mismo repo

```
packages/core/     domain/ + sus tests     ← el motor, compartido
apps/pwa/          lo de hoy               ← se sigue usando a diario
apps/ios/          Expo                    ← la del Store
```

**Por qué el mismo repo:** lo valioso de Gymtracker no es la UI, es el motor
(`progresar`, `sugerirPeso`, `aprender`) con 274 tests que costaron meses de bugs
reales. Ese motor tiene que ser uno solo: el día que se ajuste la regla del techo
del rango, no puede arreglarse en una app y quedar roto en la otra. Un PR toca las
dos, los tests viven con el motor, un solo CI. Precedente propio:
`health-monitor-ios` vive dentro del repo `healthmonitor`.

**El costo real:** hay que mover el deploy de Render a `apps/pwa` (`rootDir` en
`render.yaml`). Es el único paso con riesgo de romper algo que hoy funciona, así
que va **solo, en su propio PR**, verificando que el deploy siga saliendo antes
de seguir.

---

## Plan por etapas

Con el App Store como motor, el Live Activity del descanso **no es prioridad**:
es un lujo que suma en las capturas, no lo que desbloquea publicar.

1. **Monorepo + extraer `core`.** Sin esto no hay dos apps, hay dos copias
   divergiendo. Incluye mover el deploy de Render.
2. **App Expo local-only.** Sin sync, sin login. Inicio, sesión, registrar
   series, timer, progreso.
3. **Onboarding.** Hoy se da por hecho que la rutina existe. Un usuario nuevo
   abre la app y tiene que poder armar una rutina o elegir una plantilla. Sin
   esto hay rechazo por 4.2.
4. **Requisitos del Store.** Política de privacidad (URL pública), URL de
   soporte, íconos, capturas, ficha, nombre y keywords.
5. **Monetización.**
6. **Lo que diferencia en capturas:** Live Activity del descanso en la Dynamic
   Island, escribir el entrenamiento en HealthKit, widgets.

La PWA sigue viva y usable todo el tiempo. No hay corte.

---

## Producto y monetización

Los trackers de gimnasio son de las categorías más saturadas del Store. Una app
paga de un dev desconocido no vende sola.

**El diferencial real, y el pitch:** la mayoría de los trackers sólo registran.
Éste **te dice qué peso poner en la próxima serie**, y recalibra el salto cuando
le pisás la sugerencia. Eso va en la primera captura.

- **Modelo sugerido:** gratis con un desbloqueo único barato. No suscripción.
- Apple se lleva 15% con el Small Business Program (bajo USD 1M anuales).
- **Empezar temprano:** los formularios fiscales y bancarios en App Store Connect
  (Argentina) tardan y bloquean el cobro. No dejarlo para el final.

---

## Decidido

- La app del Store es local-only, sin backend ni cuentas.
- Monorepo en este mismo repo, con el dominio compartido.
- La PWA no se recorta: sigue con sync y uso diario.
- Primero publicar; Live Activity y HealthKit van después.

## Abierto

- Nombre de la app y bundle identifier.
- Dónde se hospeda la política de privacidad y el soporte.
- Precio del desbloqueo.
- Si el onboarding arranca con plantillas de rutina y cuáles.

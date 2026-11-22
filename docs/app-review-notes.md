# Notas para App Review

Para el campo **Notas** de *Información para la revisión de la app* en App Store
Connect.

> Ojo con cuál estás completando: TestFlight tiene su propia *Información de la
> prueba*. Son campos distintos del de la review del Store, aunque el texto
> pueda ser casi el mismo.

Van en **inglés**: el revisor lee en inglés aunque la app esté en español.

**Estado: respondiendo el pedido de información adicional de App Review**
(2026-11-22). El texto de abajo está numerado 1 a 6 siguiendo exactamente el
orden en que Apple pidió las cosas — así el revisor tacha su lista sin buscar.

Verificado contra el código (`apps/ios`, build 6, v1.0.0):

- **Cero llamadas de red.** No hay `fetch` ni ninguna URL en `apps/ios/src`.
  `packages/core` sólo contiene `domain` y `utils`; el módulo `sync` quedó
  fuera del paquete compartido.
- **Sin servicios externos.** Las dependencias son React Native, React
  Navigation, AsyncStorage (local), `expo-haptics`, `expo-splash-screen`,
  `expo-status-bar`. Sin analytics, sin crash reporting, sin `expo-updates`,
  sin compras integradas.
- **Sin permisos.** `app.json` sólo declara
  `ITSAppUsesNonExemptEncryption: false`.
- **Un solo idioma.** No hay localización: la interfaz es en español.
- `OnboardingScreen.js` entrega una rutina de arranque, así que no hay pantalla
  vacía en el primer uso.

---

## 1. La grabación de pantalla la tenés que hacer vos

Va como **adjunto** en *Información para la revisión*, no pegada en Notas.

Requisitos de Apple: dispositivo físico, el sistema operativo más reciente,
empieza con el lanzamiento de la app y muestra el flujo típico.

Alcanza con unos 90 segundos:

1. Tocar el ícono en la pantalla de inicio — tiene que verse el arranque.
2. El onboarding completo, hasta "Empezar a entrenar".
3. "Empezar" y entrar a un ejercicio.
4. Registrar una serie: reps, cuánto te sobró, "Guardar serie".
5. **Que se vea la sugerencia de peso de la serie siguiente.** Es lo que
   demuestra que la app hace algo, y es lo que el revisor tiene que ver sí o sí.
6. Completar el ejercicio y terminar la sesión hasta el resumen.

Las tres cosas que Apple pide incluir *si existen* —registro y borrado de
cuenta, contenido generado por usuarios, contenido pago— **no existen en esta
app**. No hay que grabarlas, pero sí decirlo en las notas, que es lo que hace el
punto 1 del texto.

---

## Texto para pegar en Notas

```
Thank you for reviewing IronWorks. Below is the information requested, in the
same order.

NO ACCOUNT OR LOGIN IS REQUIRED, and the app requests no permissions.

1. SCREEN RECORDING
A screen recording captured on a physical device running the latest iOS is
attached to this submission. It starts with launching the app and shows the
typical user flow: onboarding, starting a training day, logging a set, the
automatic weight suggestion for the next set, and the end-of-session summary.

The three items listed in your request do not exist in this app, so they do
not appear in the recording:
- There is no account registration, login, or account deletion, because the
  app has no accounts and no server. All data is stored locally on the device.
- There is no user-generated content shared with anyone. The user creates
  their own routines and notes, which stay on their own device and are never
  uploaded or visible to other users. The app has no social, sharing, or
  messaging features, so content reporting and blocking do not apply.
- There is no paid content and no in-app purchases. The app is free and fully
  functional.

2. PURPOSE AND TARGET AUDIENCE
IronWorks is a strength-training log for people who train with weights in a
gym and follow a structured routine.

The problem it solves: progressive overload requires deciding, session after
session, whether to add weight, keep it, or back off, and for every exercise.
People normally do this from memory or in a spreadsheet, and end up either
stalling at the same load for months or jumping too fast.

The value it provides: the user records the reps performed and how many reps
they had left in reserve, and the app computes the load for the next set and
for the next session from that history. It also warns when an exercise was
already trained in another day of the routine in the last 7 days, to avoid
overlapping the same muscle group.

3. SETUP AND ACCESS TO MAIN FEATURES
No credentials, sample files, or configuration are required.

a. On first launch the app shows a short introduction and creates a starter
   routine, so there is no empty state. Tap "Empezar a entrenar" to finish.
b. On the home screen, tap "Empezar" to begin the suggested training day.
c. Tap any exercise in the list to open it.
d. Enter the number of reps, choose one of the options under "¿CUÁNTO TE
   SOBRÓ?" (how many reps you had left), and tap "Guardar serie".
e. From the second set on, a suggested weight for the next set appears below
   the weight card, together with the reason for the suggestion. Tapping it
   applies that weight.
f. After completing the sets, tap "Terminar sesión" to see the day's summary.
g. Routines can be edited at any time from "Ajustes": days, exercises,
   starting weights, increments and rep ranges.

4. EXTERNAL SERVICES, TOOLS AND PLATFORMS
None. The app makes no network requests whatsoever.

There are no data providers, no authentication services, no payment
processors, no AI services, no analytics, no crash reporting, and no remote
configuration or over-the-air updates. The app has no networking code: all
computation, including the weight progression logic, runs on the device.

Data is stored locally using the system's standard on-device storage. Nothing
is transmitted off the device at any time.

5. REGIONAL DIFFERENCES
There are none. The app behaves identically in every region: the same
features, the same content, and the same offline behavior. It does not use
location, does not vary content by country, and has no region-restricted
functionality.

The interface is available in Spanish only, which is the app's single
supported language in all regions.

6. REGULATED INDUSTRY AND THIRD-PARTY MATERIAL
Not applicable.

IronWorks does not operate in a regulated industry. It is a personal training
log. It does not provide medical, diagnostic, or therapeutic advice, makes no
health claims, does not read or write Apple Health data, and is not intended
to treat or prevent any condition. The weight suggestions are arithmetic over
what the user recorded, not health guidance.

It contains no protected third-party material: no licensed exercise database,
no third-party videos, images, or text, and no branded content. Exercise names
are generic terms, and all routine content is created by the user.
```

---

## Los otros campos de esa pantalla

| Campo | Qué poner |
|---|---|
| **Se requiere inicio de sesión** | **No** |
| Nombre y apellido / teléfono / email | Datos de contacto reales |
| **Archivos adjuntos** | **La grabación de pantalla** |

---

## Antes de reenviar

- [ ] Adjuntar la grabación. Sin eso, el punto 1 del texto es falso y es rechazo
      seguro.
- [ ] **Verificar que `https://gymt.sparkio.me/privacy.html` devuelva 200.** El
      archivo está en `apps/pwa/public/privacy.html`, pero no pude comprobarlo
      desde acá. Apple abre esa URL.
- [ ] Repasar los pasos *a* a *g* con el build que vas a enviar, en la mano. Si
      un botón cambió de nombre, corregilo acá.
- [ ] Si agregaste permisos, compras o cualquier llamada de red desde el build
      6, los puntos 1, 4 y 6 dejan de ser ciertos y hay que reescribirlos.
- [ ] Que las etiquetas de privacidad digan "no se recopilan datos", coherente
      con el punto 4.

---

## Por qué está redactado así

- **Numerado 1 a 6 igual que el pedido.** El revisor tacha su lista sin tener
  que buscar las respuestas.
- **Lo que no existe se dice, no se omite.** Si no contestás sobre cuentas o
  contenido pago, parece que lo estás esquivando.
- **El punto 4 es el más fuerte que tenés** y conviene que sea rotundo: cero
  red, cero terceros. La mayoría de las apps no puede decir eso.
- **El punto 6 aclara que no es una app de salud.** Un tracker de gimnasio
  puede confundirse con algo médico, y eso dispara requisitos que no querés.
- **Sin promesas que el build no cumpla.** Una nota que no coincide con la app
  es peor que no escribir ninguna.

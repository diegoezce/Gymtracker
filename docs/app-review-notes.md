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

**La grabación hecha (2026-11-22) cubre además** de ese mínimo: agregar y quitar
ejercicios, la pantalla de Progreso, y "Exportar mis datos" — que abre el share
sheet del sistema y pega el JSON en Notas. Eso suma funcionalidad demostrada
para 4.2, pero hay que avisarlo en las notas: la grabación **se sale de la app**
un momento, y sin aviso parece una grabación cortada. Por eso el punto 1 del
texto lo nombra.

> El botón de exportar está en **Progreso**, no en Ajustes
> (`ProgresoScreen.js:58`). Ajustes sólo edita ejercicios. Si las notas dijeran
> "Ajustes", el revisor lo busca ahí, no lo encuentra, y eso es otro rechazo.

Las tres cosas que Apple pide incluir *si existen* —registro y borrado de
cuenta, contenido generado por usuarios, contenido pago— **no existen en esta
app**. No hay que grabarlas, pero sí decirlo en las notas, que es lo que hace el
punto 1 del texto.

---

## Texto para pegar en Notas

El campo admite **4000 caracteres**. Esto ocupa 3890, así que quedan 110 de
margen: si agregás algo, medilo antes (`wc -c`).

**Va a propósito sin cortes de línea**: un párrafo por renglón, y cada viñeta y
cada paso en un solo renglón. El `textarea` de App Store Connect envuelve solo,
así que si lo cortás a mano queda con saltos en mitad de las oraciones. No lo
reformatees al pegarlo.

```
Thank you for reviewing IronWorks. The requested information follows, in the same order.

NO ACCOUNT OR LOGIN IS REQUIRED, and the app requests no permissions.

1. SCREEN RECORDING
Attached: a recording from a physical device on the latest iOS. It begins with launching the app and shows the typical flow: onboarding, starting a training day, logging a set, the automatic weight suggestion for the next set, and the session summary. It then shows adding and removing exercises, the progress screen, and the data export; it briefly leaves the app to paste the exported JSON into Notes.

The three items you list do not exist in this app, so they are not in the recording:

- No account registration, login or deletion: the app has no accounts and no server. All data stays on the device.
- No user-generated content shared with anyone. Routines and notes stay on the user's own device and are never uploaded or visible to others. There are no social, sharing or messaging features, so reporting and blocking do not apply.
- No paid content and no in-app purchases. The app is free and fully functional.

2. PURPOSE AND TARGET AUDIENCE
IronWorks is a strength-training log for people who train with weights and follow a structured routine.

The problem: progressive overload means deciding, session after session and for every exercise, whether to add weight, hold it or back off. People do this from memory or in a spreadsheet, and end up either stalling for months or jumping too fast.

The value: the user records the reps performed and how many were left in reserve, and the app computes the load for the next set and the next session from that history. It also warns when an exercise was already trained on another day of the routine within the last 7 days.

3. SETUP AND ACCESS TO MAIN FEATURES
No credentials, sample files or configuration are required.

a. On first launch the app shows a short introduction and creates a starter routine, so there is no empty state. Tap "Empezar a entrenar".
b. On the home screen, tap "Empezar" to begin the suggested training day.
c. Tap any exercise in the list.
d. Enter the reps, choose an option under "¿CUÁNTO TE SOBRÓ?" (how many reps were left), and tap "Guardar serie".
e. From the second set on, a suggested weight appears below the weight card with the reason for it. Tapping it applies that weight.
f. After the sets, tap "Terminar sesión" for the day's summary.
g. Routines are editable at any time from "Ajustes".
h. On the progress screen, "Exportar mis datos" shares the whole history as JSON through the system share sheet, with no account involved.

4. EXTERNAL SERVICES, TOOLS AND PLATFORMS
None. The app makes no network requests whatsoever.

No data providers, authentication services, payment processors, AI services, analytics, crash reporting, remote configuration or over-the-air updates. The app contains no networking code; all computation, including the weight progression logic, runs on the device. Data is stored locally using the system's standard on-device storage.

5. REGIONAL DIFFERENCES
None. The app behaves identically in every region: same features, same content, same offline behavior. It does not use location and has no region-restricted functionality. The interface is in Spanish only, its single supported language in all regions.

6. REGULATED INDUSTRY AND THIRD-PARTY MATERIAL
Not applicable. IronWorks is a personal training log. It provides no medical, diagnostic or therapeutic advice, makes no health claims, does not read or write Apple Health data, and is not intended to treat or prevent any condition. The weight suggestions are arithmetic over what the user recorded.

It contains no protected third-party material: no licensed exercise database, no third-party video, images or text, and no branded content. Exercise names are generic terms and all routine content is created by the user.
```

### Si el build tiene compra integrada

No encontré ninguna en el código. Si la agregás, reemplazá el tercer guion
del punto 1 y sumá al punto 4 el procesador de pagos — y volvé a medir.

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

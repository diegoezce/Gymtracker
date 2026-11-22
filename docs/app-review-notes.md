# Notas para App Review

Para el campo **Notas** de *Información para la revisión de la app* en App Store
Connect.

> Ojo con cuál estás completando: TestFlight tiene su propia *Información de la
> prueba* (descripción para testers + *Información de revisión de la app beta*).
> Son campos distintos del de la review del Store, aunque el texto puede ser
> casi el mismo.

Van en **inglés**: el revisor lee en inglés aunque la app esté en español. Y
conviene decirle explícitamente que la interfaz está en español, o puede
confundir "no entiendo la pantalla" con "la app no funciona".

**Lo más importante está en el primer renglón.** La causa número uno de que un
tracker quede trabado en revisión es que el revisor no puede pasar del login.
Esta app no tiene, y hay que decirlo antes que nada.

Verificado contra el código al 2026-11-22 (`apps/ios`, build 6, v1.0.0):

- No hay login ni sync: no aparece `hm.sparkio.me`, `obtenerToken` ni nada de
  Health Monitor en `apps/ios/src`.
- `OnboardingScreen.js` existe y entrega una rutina de arranque, así que no hay
  pantalla vacía en el primer uso.
- `app.json` **no declara ningún permiso**: sólo
  `ITSAppUsesNonExemptEncryption: false`. La app no pide cámara ni
  notificaciones.
- Los nombres de botones de abajo salen de las pantallas reales.

---

## Texto para pegar

```
Thank you for reviewing IronWorks.

NO ACCOUNT OR LOGIN IS REQUIRED. The app works fully offline and stores all
data locally on the device. There is no server, no sign-up, and no demo
credentials are needed.

IronWorks also requests no permissions at all: no camera, no notifications,
no location, no health data.

WHAT THE APP DOES
IronWorks is a strength-training log built around progressive overload. Its
distinguishing feature is weight autoregulation: after each set you record the
reps you did and how many you had left in reserve, and the app suggests the
load for your next set and for your next session.

HOW TO TEST IT (about 2 minutes)
1. On first launch the app walks you through a short intro and sets up a
   starter routine. Tap "Empezar a entrenar" at the end.
2. On the home screen, tap "Empezar" to begin the suggested training day.
3. Tap any exercise in the list.
4. Enter the number of reps, tap one of the options under "¿CUÁNTO TE SOBRÓ?"
   (how many reps you had left), and tap "Guardar serie".
5. From the second set on, a suggested weight appears below the weight card,
   with the reason for the suggestion. Tapping it applies that weight.
6. Finish the remaining sets, then tap "Terminar sesión" to see the summary
   for the day.

LANGUAGE
The interface is in Spanish, which is the app's primary language.

PRIVACY
The app does not collect or transmit any data. Nothing leaves the device.
```

### Si el build tiene compra integrada

No encontré ninguna en el código. Si la agregás, sumá:

```
IN-APP PURCHASE
The app is free to use. [Qué desbloquea la compra.] To reach it, go to [ruta
exacta en la UI]. It is a one-time unlock, not a subscription, and is
available for testing in the sandbox environment.
```

---

## Los otros campos de esa pantalla

| Campo | Qué poner |
|---|---|
| **Se requiere inicio de sesión** | **No.** Es lo que evita que pidan cuenta de demo |
| Nombre y apellido / teléfono / email | Datos de contacto reales |
| Archivos adjuntos | Nada, salvo algo difícil de encontrar en la UI |

---

## Antes de enviar

- [ ] **Verificar que `https://gymt.sparkio.me/privacy.html` devuelva 200.** El
      archivo está en `apps/pwa/public/privacy.html`, así que Render lo debería
      publicar, pero no pude comprobarlo desde acá (el proxy bloquea el
      dominio). Apple abre esa URL; si da 404, es rechazo.
- [ ] Repasar los pasos 1 a 6 con el build que vas a enviar, en la mano. Si un
      botón cambió de nombre, corregilo acá.
- [ ] Confirmar que el build no incorporó permisos nuevos. Si agregás cámara
      para las fotos de técnica, hay que volver a poner el bloque de permisos y
      que coincida con las descripciones del `Info.plist`.
- [ ] Que las etiquetas de privacidad digan "no se recopilan datos", coherente
      con el último párrafo.
- [ ] Agregar o borrar el bloque de compra integrada.

---

## Por qué está redactado así

- **Primero que no hay login, y segundo que no pide permisos.** Las dos cosas
  que más fricción generan en review, resueltas en el primer tercio del texto.
- **Pasos numerados y cortos.** El revisor dedica minutos, no media hora.
- **El paso 5 es el importante.** Es la sugerencia de peso: lo único que esta
  app hace y la mayoría no. Si el revisor no llega a verlo, la juzga como "otro
  tracker más", que es el territorio del rechazo por funcionalidad mínima.
- **Sin promesas que el build no cumpla.** Una nota que no coincide con la app
  es peor que no escribir nada.

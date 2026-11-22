# Notas para App Review

Para el campo **Notas** de *Información para la revisión de la app* en App Store
Connect.

Van en **inglés**: el revisor lee en inglés aunque la app esté en español. Y
conviene decirle explícitamente que la interfaz está en español, o puede
confundir "no entiendo la pantalla" con "la app no funciona".

**Lo más importante está en el primer renglón.** La causa número uno de que un
tracker quede trabado en revisión es que el revisor no puede pasar del login.
Esta app no tiene, y hay que decirlo antes que nada.

Estado: **borrador.** Las partes entre `[...]` dependen del build final y hay que
completarlas antes de enviar — ver la checklist al final.

---

## Texto para pegar

```
Thank you for reviewing Gymtracker.

NO ACCOUNT OR LOGIN IS REQUIRED. The app works fully offline and stores all
data locally on the device. There is no server, no sign-up, and no demo
credentials are needed.

WHAT THE APP DOES
Gymtracker is a strength-training log. Its distinguishing feature is weight
autoregulation: after each set you record the reps you did and how many you had
left in reserve, and the app suggests the load for your next set and for your
next session.

HOW TO TEST IT (about 2 minutes)
1. On first launch, choose one of the sample routines, or create a day and add
   an exercise to it.
2. Tap "Empezar" to start a session, then tap any exercise in the list.
3. Enter the reps you did, tap how many you had left, and tap "Guardar serie".
4. After the first set, a suggested weight for the next set appears below the
   weight card, with the reason for the suggestion.
5. Tap "Terminar ejercicio" and then end the session to see the summary screen.

LANGUAGE
The interface is in Spanish (Argentina), which is the app's primary language.

PERMISSIONS
- Camera / photo library (optional): used only to attach a reference photo to
  an exercise's technique notes. The app is fully usable without granting it.
- Notifications (optional): used only for a local notification when a rest
  timer finishes. There are no push notifications and no remote server.

PRIVACY
The app does not collect or transmit any data. Nothing leaves the device.

[SI HAY COMPRA INTEGRADA, agregar:]
IN-APP PURCHASE
The app is free to use. [Describir qué desbloquea la compra.] To reach it, go
to [ruta exacta en la UI]. The purchase is a one-time unlock, not a
subscription, and is available for testing in the sandbox environment.

[SI QUEDA ALGUNA FUNCIÓN QUE NECESITE EL BACKEND PERSONAL, agregar:]
NOTE: [Nombre de la función] is disabled in this build. It is a personal
feature that is not part of the App Store version.
```

---

## Los otros campos de esa pantalla

| Campo | Qué poner |
|---|---|
| **Se requiere inicio de sesión** | **No.** Es lo que evita que pidan cuenta de demo |
| Nombre y apellido / teléfono / email | Datos de contacto reales, por si el revisor necesita escribir |
| Archivos adjuntos | Nada, salvo que haya algo difícil de encontrar en la UI |

---

## Antes de enviar, completar

- [ ] **Confirmar que el build no tiene login ni sync.** Si queda una pantalla
      de Health Monitor visible, el revisor la va a encontrar y la nota pasa a
      ser falsa. Es el riesgo más concreto de toda la revisión.
- [ ] **Verificar el paso 1 contra la app real.** Hoy el onboarding no existe
      (etapa 3 del plan). Si al abrir por primera vez no hay forma obvia de
      tener una rutina, eso es exactamente el rechazo por 4.2 que estamos
      tratando de evitar — y ninguna nota lo salva.
- [ ] Ajustar los nombres de los botones a los del build final (hoy: "Empezar",
      "Guardar serie", "Terminar ejercicio").
- [ ] Confirmar qué permisos pide realmente el build y borrar los que no.
- [ ] Completar el bloque de compra integrada, o borrarlo si no hay.
- [ ] Que las descripciones de permisos del `Info.plist` digan lo mismo que
      estas notas. Si no coinciden, lo marcan.
- [ ] Que las etiquetas de privacidad digan "no se recopilan datos", coherente
      con el último párrafo.

---

## Por qué está redactado así

- **Primero que no hay login.** Es lo que desbloquea la revisión; todo lo demás
  es secundario.
- **Pasos numerados y cortos.** El revisor dedica minutos, no media hora. Si no
  llega a ver la función que distingue a la app, la juzga como "otro tracker
  más", que es el territorio del rechazo por funcionalidad mínima.
- **El paso 4 es el importante.** Es la sugerencia de peso: lo único que esta
  app hace y la mayoría no. Que el revisor lo vea sí o sí.
- **Permisos explicados uno por uno, y marcados como opcionales.** Un permiso
  sin justificación visible es motivo de rechazo.
- **Sin promesas que el build no cumpla.** Una nota que no coincide con la app
  es peor que no escribir nada.

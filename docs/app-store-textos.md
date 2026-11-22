# Textos de la ficha — IronWorks

Textos para App Store Connect, listos para pegar. Las notas dirigidas al
revisor están aparte, en [`app-review-notes.md`](app-review-notes.md).

**En español neutro, sin voseo.** La localización elegida es *Español (México)*,
que es la que cubre Latinoamérica en el Store. El voseo ("creá", "entrenás") se
lee raro fuera del Cono Sur, así que todo va en tuteo. Mismo criterio para el
vocabulario: "hojas de cálculo", no "planillas".

---

## Descripción para testers de TestFlight

Campo *Información de la app beta* → descripción.

```
IronWorks es una aplicación de seguimiento de entrenamiento diseñada para automatizar la sobrecarga progresiva.

Crea tus rutinas, configura los pesos iniciales, incrementos y rangos de repeticiones, y registra tus series mientras entrenas.

IronWorks ajusta automáticamente las cargas para tu próxima sesión según tu rendimiento, ayudándote a progresar sin cálculos manuales.

Todos tus datos se almacenan localmente en tu dispositivo. No necesitas crear una cuenta ni conexión a Internet.

Esta versión beta tiene como objetivo probar el registro de entrenamientos, la progresión automática de cargas, la facilidad de uso y la estabilidad general de la aplicación.
```

El último párrafo es específico de la beta: al publicar en el Store hay que
sacarlo.

---

## Otros campos, cuando toque publicar

Todavía sin escribir. Quedan anotados para no improvisarlos sobre la fecha:

| Campo | Límite | Estado |
|---|---|---|
| Nombre de la app | 30 caracteres | `IronWorks: Gym Tracker` (ya está en `app.json`) |
| Subtítulo | 30 caracteres | pendiente |
| Texto promocional | 170 caracteres | pendiente |
| Descripción | 4000 caracteres | pendiente — se puede partir de la de arriba sin el párrafo de beta |
| Palabras clave | 100 caracteres, separadas por coma | pendiente |
| Novedades de esta versión | 4000 caracteres | pendiente |

**Lo que tiene que quedar en el primer renglón**, porque es lo único que se ve
sin desplegar y es lo que diferencia a la app: *te dice qué peso usar en la
próxima serie*. La mayoría de los trackers sólo registran.

**Para las palabras clave:** no repetir las que ya están en el nombre, Apple las
indexa igual. No usar nombres de otras apps.

# MacroFit

Calculadora y rastreador de calorías y macronutrientes. Es una PWA (Progressive Web App) hecha con React, TypeScript y Tailwind CSS. Está pensada para iPhone (optimizada para el 15 Pro Max), en modo oscuro y en español.

## Funciones

- **Perfil**: sexo, edad, estatura, peso, nivel de actividad y objetivo (perder grasa / recomposición / ganar músculo).
- **Calculadora**: basal con Mifflin-St Jeor, mantenimiento = basal × factor de actividad, y un ajuste configurable de −35 % a +25 %.
- **Macros**: proteína en g/kg + grasa en % (los carbohidratos llenan el resto), o un reparto libre por porcentajes.
- **Registro diario** por desayuno, comida, cena y snacks. Se puede anotar en gramos o en porciones caseras (pieza, taza, cucharada…). Puedes editar o borrar cada registro y copiar una comida del día anterior.
- **Alimentos**:
  - Base local de más de 110 alimentos, platillos y marcas comunes en México (Bimbo, Lala, La Costeña, FUD, Herdez…). Usa valores aproximados de referencia USDA/SMAE.
  - Búsqueda en línea en **Open Food Facts** (México), también por **código de barras**.
  - Alimentos **personalizados** que capturas a mano, por 100 g o por porción.
  - Cada alimento muestra de dónde vienen sus datos.
- **Dashboard** con anillos de progreso de calorías, proteína, carbohidratos y grasa, gráfica de los últimos 7 días y resumen de peso.
- **Peso**: gráfica por semana, mes, 3 meses o todo, con tendencia (media de 7 registros), ritmo semanal, promedios semanales e IMC.
- **Datos guardados** en el propio dispositivo (localStorage), con exportación e importación de respaldos en JSON.
- **Datos de ejemplo** para explorar la app sin capturar nada.
- **PWA**: se instala en la pantalla de inicio y abre la app aunque no tengas conexión.

## 1. Ejecutarla en tu computadora

Requisitos: [Node.js](https://nodejs.org) 20 o superior (elige la versión LTS).

```bash
cd macrofit
npm install        # solo la primera vez
npm run dev        # servidor de desarrollo con recarga automática
```

Abre http://localhost:5173 en tu navegador. Para verla como celular en Chrome: abre DevTools (F12), entra al modo dispositivo y elige *iPhone 14 Pro Max* (mide igual que el 15 Pro Max: 430 × 932).

Para probar la versión final (la que incluye el modo sin conexión):

```bash
npm run build
npm run preview    # http://localhost:4173
```

## 2. Verla en tu iPhone (misma red Wi-Fi)

1. Conecta la computadora y el iPhone a la **misma red Wi-Fi**.
2. Ejecuta `npm run dev`. En la terminal aparecerá una línea como esta:
   `➜  Network: http://192.168.1.50:5173/`
3. En el iPhone abre **Safari** y escribe esa dirección.
4. Si no carga, permite Node.js en el firewall de tu computadora (en Windows te lo pregunta la primera vez; en Mac está en Ajustes del Sistema → Red → Firewall).

> En la red local la app funciona completa, pero iOS solo activa el modo sin conexión cuando la página se sirve por **HTTPS**. Para tener la experiencia completa de app instalada, publícala (paso 3).

## 3. Publicarla en internet (gratis)

### Opción A: Vercel (recomendada)
1. Sube la carpeta `macrofit` a un repositorio de GitHub.
2. Entra a https://vercel.com con tu cuenta de GitHub → **Add New → Project** → elige el repositorio.
3. Vercel detecta Vite solo (Build: `npm run build`, Output: `dist`). Pulsa **Deploy**.
4. Obtendrás una dirección `https://macrofit-xxxx.vercel.app`.

### Opción B: Netlify sin GitHub
1. Ejecuta `npm run build`.
2. Entra a https://app.netlify.com/drop y arrastra la carpeta `dist`.

### Instalarla en el iPhone
1. Abre tu dirección `https://…` en **Safari**.
2. Toca **Compartir** (el cuadro con la flecha) → **Agregar a pantalla de inicio** → **Agregar**.
3. MacroFit aparece con su ícono, abre a pantalla completa y funciona sin conexión.

> **Importante sobre tus datos:** se guardan en el navegador del dispositivo donde los capturas. La app instalada en la pantalla de inicio tiene su propio almacenamiento, distinto del de Safari, así que **usa siempre la app instalada**. Exporta un respaldo de vez en cuando desde *Perfil → Tus datos*.

## Arquitectura

```
src/
  lib/          tipos, calculadoras (calc.ts), fechas, API de alimentos
  data/         base local de alimentos MX y generador de datos de ejemplo
  store/        estado global (Zustand) + adaptador de almacenamiento + preparación de sincronización
  components/   UI reutilizable: anillos, gráficas, hoja inferior, formularios
  screens/      Hoy, Diario, Agregar alimento, Peso, Perfil, Bienvenida
public/         manifest, service worker (sw.js) e íconos
```

**Lista para sincronizar en la nube.** Cada registro (comida, peso, alimento personalizado) tiene un `id` único, `updatedAt` y borrado lógico (`deleted`). `store/sync.ts` ya incluye `mergeRecords` (gana la última escritura) y la interfaz `CloudSync`. Para agregar cuentas y sincronización (por ejemplo con Supabase o Firebase) hay que hacer dos cosas:
1. Implementar `CloudSync` (`pull` / `push`) contra el backend.
2. Llamarlo al abrir la app y después de cada cambio.

`store/storage.ts` define un `StorageAdapter`, de modo que localStorage se puede cambiar por IndexedDB sin tocar las pantallas.

**Fuentes de datos nutricionales.**
- *MacroFit · ref. USDA/SMAE*: valores aproximados por 100 g (ver `src/data/foods.ts`; puedes agregar más filas).
- *Open Food Facts*: base colaborativa (licencia ODbL); conviene comparar con la etiqueta.
- *Personalizado*: lo que capturas tú.

## Scripts

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo (también visible en la red local) |
| `npm run build` | Revisión de tipos y compilación de producción en `dist/` |
| `npm run preview` | Sirve `dist/` para probar la versión final |
| `npm run icons` | Regenera los PNG a partir de `public/icons/icon.svg` (requiere `npm i -D playwright`) |

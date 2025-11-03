# Formularios Empaquetados y Merma

Frontend estático para registrar Empaquetados y Merma, conectado a un Google Apps Script que escribe en Google Sheets.

## Estructura del repo

```
/docs/                 # Carpeta publicada por GitHub Pages
  index.html           # App principal con ambos formularios
  menu.html            # Pantalla de menú para elegir formulario
  styles.css           # Estilos
  script.js            # Envío hacia Apps Script + lógica de formularios
  BRAND.svg            # Logo de ejemplo (opcional)
  CODIGOS DESCRIPCION Unidad_Primaria.tsv  # Referencia de productos (opcional)
/frontend/             # Carpeta original de trabajo (fuente), puedes seguir editando aquí si lo deseas
```

GitHub Pages publicará el contenido de `docs/`. Si editas los archivos dentro de `frontend/`, recuerda copiar tus cambios a `docs/` para publicar.

## Configurar la URL del backend (Apps Script)

En `docs/script.js` está esta constante:

```js
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbygvu8qFAekQ4HFuSQY0lF2S-lu1m-8JPvn7_gNkx9Ytmnu0GfOx0rCH7HYxsIIjAUvjw/exec";
```

Sustitúyela por tu URL de despliegue si cambia (termina en `/exec`). El resto se arma solo.

## Correr localmente (opciones)

- Opción rápida: abre `docs/menu.html` con doble clic. Debido a CORS abiertos en Apps Script, suele funcionar.
- Recomendado: usa una extensión tipo "Live Server" en VS Code y abre `docs/`.

## Publicar en GitHub Pages

1. Crea el repo en GitHub (ej: `usuario/Formularios.Empa.Merma`).
2. En tu carpeta del proyecto:

```bat
:: Inicializa el repo local y primer commit
git init
git add .
git commit -m "Inicializa front + docs para GitHub Pages"

:: Crea rama principal
git branch -M main

:: Conecta con tu repo remoto (copia tu URL HTTPS)
:: Ejemplo: git remote add origin https://github.com/usuario/Formularios.Empa.Merma.git

:: Sube los cambios
git push -u origin main
```

3. En GitHub > Settings > Pages:
   - Source: Deploy from a branch
   - Branch: `main` y carpeta `/docs`

4. Tu sitio quedará disponible en: `https://usuario.github.io/Formularios.Empa.Merma/`.
   - Entra directo por `https://usuario.github.io/Formularios.Empa.Merma/docs/menu.html` o configura un `index.html` en la raíz si prefieres.

## Verificación rápida

- Abre `docs/menu.html` y entra a cada formulario.
- Completa datos mínimos.
- Agrega un par de productos y cantidades.
- Envía y confirma que aparecen filas en las pestañas Empaquetado/Merma de tu hoja.

## Notas

- No necesitas Vercel para usar Google Apps Script como backend.
- Si actualizas el código del Apps Script, recuerda desplegar una nueva versión del Web App y actualizar `WEB_APP_URL` si cambia.
- Si prefieres no usar GitHub Pages, puedes publicar `docs/` en cualquier hosting estático.

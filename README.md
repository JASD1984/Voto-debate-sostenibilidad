# Programa de votación para el debate farmacéutico

Interfaz web para que el alumnado vote los mejores argumentos a favor y en contra. Registra los resultados en una hoja de cálculo de Google y visualiza estadísticas en tiempo real.

## Contenidos

- `index.html` — página principal con pestañas, formulario de voto y visualizaciones.
- `styles.css` — estilos y diseño visual.
- `app.js` — lógica de interacción y conexión con Google Apps Script.
- `roster-data.js` — datos de respaldo extraídos de `Debate.pdf`.
- `google-apps-script.js` — backend (Google Apps Script) que habla con Google Sheet.
- `assets/pattern.svg` — fondo decorativo.

## Cómo prepararlo

### 1. Crear la hoja de cálculo

1. Crea un Google Sheet nuevo.
2. Renombra la primera pestaña como `Roster` y coloca estos encabezados en la fila 1:
   ```
   Alumno/a | Tema | Postura | Notas
   ```
3. Copia los datos del PDF `Debate.pdf` en esa hoja (coinciden con `roster-data.js`).
4. Crea otra pestaña llamada `Votes` (los encabezados se rellenarán automáticamente al registrar el primer voto).

### 2. Configurar Google Apps Script

1. Con la hoja abierta ve a **Extensiones → Apps Script**.
2. Elimina cualquier código que aparezca y pega el contenido de `google-apps-script.js`.
3. Guarda con un nombre descriptivo, por ejemplo `RegistroDebate`.
4. En el menú **Implementar → Implementaciones nuevas**:
   - Elige tipo **Aplicación web**.
   - Versión: crea una nueva descripción.
   - Ejecutar como: **Tú mismo**.
   - Quién puede acceder: **Cualquiera con el enlace**.
   - Pulsa **Implementar** y copia el `URL del servicio web` (termina en `/exec`).

- Ponderación por defecto: 1.º=2, 2.º=1.5, 3.º=1. Si la modificas, actualiza la constante `POINTS_BY_RANK` en ambos archivos (`app.js` y `google-apps-script.js`) y vuelve a publicar el Web App.

### 3. Conectar la web con el script

1. Abre `app.js`.
2. Sustituye el texto `PEGAR_URL_DE_TU_WEBAPP_AQUI` por la URL copiada en el paso anterior.
3. Guarda el archivo.

### 4. Probar el formulario

1. Abre `index.html` (doble clic o usando un servidor local como Live Server).
2. Completa un voto de prueba.
3. Comprueba que en la pestaña `Votes` del Google Sheet aparecen seis filas (3 a favor + 3 en contra).
4. Revisa la pestaña **Resultados en tiempo real**: debería reflejar los datos tras recargar.

## Personalización

- **Diseño**: modifica colores y tipografías en `styles.css`.
- **Puntuaciones**: ajusta `POINTS_BY_RANK` tanto en `app.js` como en `google-apps-script.js` si cambias las ponderaciones.
- **Mensajes**: personaliza los textos de confirmación en `app.js`.
## Solución de problemas

- **No se registran votos**: verifica que la URL de Apps Script es correcta y que la implementación permite acceso a cualquiera con el enlace.
- **CORS / bloqueos**: asegúrate de abrir `index.html` desde `http://` (ej. Live Server) si tu navegador bloquea peticiones desde `file://`.
- **Gráficas sin datos**: confirma que la hoja `Votes` contiene registros y que en el desplegable `Emitir voto` no quedan puestos sin seleccionar.
- **Participantes nuevos**: añade la nueva fila en `Roster` y pulsa recargar en la web.

¡Listo! La clase ya puede votar durante las 48 horas previstas y el panel mostrará quién lidera cada categoría.

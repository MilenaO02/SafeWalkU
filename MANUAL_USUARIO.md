# Manual de Usuario — SafeWalk U 🛡️

Bienvenido al **Manual de Usuario de SafeWalk U**, la plataforma de acompañamiento preventivo y seguridad universitaria diseñada para la comunidad de la **Universidad Internacional del Ecuador (UIDE)**.

---

## 📌 Tabla de Contenidos
1. [Introducción](#-introducción)
2. [Acceso al Sistema](#-acceso-al-sistema)
   - [Registro de Usuario](#registro-de-usuario)
   - [Inicio de Sesión](#inicio-de-sesión)
3. [Módulo de Estudiante](#-módulo-de-estudiante)
   - [Buscador Inteligente tipo Google Maps](#1-buscador-inteligente-tipo-google-maps)
   - [Navegación en el Mapa Interactivo](#2-navegación-en-el-mapa-interactivo)
   - [Botón SOS / Alerta de Emergencia](#3-botón-sos--alerta-de-emergencia)
   - [Reporte de Incidentes con Evidencias](#4-reporte-de-incidentes-con-evidencias)
   - [Contactos de Apoyo](#5-contactos-de-apoyo)
4. [Módulo de Administrador](#-módulo-de-administrador)
   - [Panel de Control (Dashboard)](#1-panel-de-control-dashboard)
   - [Gestión de Reportes y Visor de Evidencias](#2-gestión-de-reportes-y-visor-de-evidencias)
   - [Editor de Ubicaciones en Google Maps](#3-editor-de-ubicaciones-en-google-maps)
   - [Editor de Rutas Seguras](#4-editor-de-rutas-seguras)
   - [Gestión de Usuarios y Permisos](#5-gestión-de-usuarios-y-permisos)
5. [Preguntas Frecuentes y Soporte](#-preguntas-frecuentes-y-soporte)

---

## 📖 1. Introducción

**SafeWalk U** es una solución web progresiva orientada a la seguridad universitaria. Permite trazados de rutas seguras, alertas inmediatas de SOS, reporte geolocalizado de incidentes con archivos adjuntos y gestión de puntos de apoyo dentro y fuera del campus universitario.

---

## 🔑 2. Acceso al Sistema

### Registro de Usuario
Para crear una cuenta en SafeWalk U:
1. Accede a la URL oficial: [https://safewalku.online](https://safewalku.online) (o `http://localhost:5173`).
2. Presiona la opción **"Crear cuenta"**.
3. Completa los campos obligatorios:
   - **Nombre y Apellido:** Únicamente letras y espacios (no se permiten números).
   - **Correo institucional:** Debe finalizar obligatoriamente en `@uide.edu.ec`.
   - **Contraseña:** Debe incluir al menos 8 caracteres, una letra mayúscula, una minúscula y un número.
4. Presiona **"Crear mi cuenta"**.

### Inicio de Sesión
1. Ingresa tu correo institucional registrado y tu contraseña.
2. Si seleccionas **"Mantener sesión iniciada"**, tu token seguro de acceso se conservará en tu navegador.
3. Presiona **"Iniciar sesión"**.

---

## 📱 3. Módulo de Estudiante

Al iniciar sesión como estudiante, accederás al mapa interactivo principal y a la botonera de herramientas preventivas.

### 1. Buscador Inteligente tipo Google Maps
- Ubicado en la parte superior del mapa.
- Escribe el nombre o dirección del lugar al que deseas dirigirte (ejemplo: *"Campus UIDE"*, *"Parque Central"*, *"Biblioteca"*).
- El autocompletado de **Google Places API** ofrecerá sugerencias en tiempo real priorizadas en **Loja, Ecuador**.
- Al seleccionar una sugerencia:
  1. El mapa se centrará automáticamente en el lugar.
  2. Aparecerá un marcador en la posición exacta.
  3. Podrás presionar **"Trazar camino seguro"** para visualizar la mejor ruta a pie y el tiempo estimado de caminata.

### 2. Navegación en el Mapa Interactivo
- El mapa funciona sobre **Google Maps JavaScript API**.
- **Usar mi GPS:** Presiona el botón del GPS para centrar la vista en tu posición actual en vivo.
- **Zonas de Riesgo:** Se muestran representadas con círculos de alerta en color rojo.
- **Lugares Seguros:** Se muestran con marcadores identificativos.

### 3. Botón SOS / Alerta de Emergencia
- Disponible en la barra inferior o lateral como un botón circular rojo de alta visibilidad.
- Al presionarlo:
  1. Se solicita confirmación inmediata.
  2. Genera una alerta SOS crítica en el centro de monitoreo con tus coordenadas de GPS exactas.
  3. Envía una notificación preventiva a tus contactos de apoyo registrados.

### 4. Reporte de Incidentes con Evidencias
- Permite informar sobre situaciones irregulares o zonas desoladas/inseguras.
- Ingresa el tipo de incidente, la ubicación y una breve descripción.
- **Adjuntar evidencia:** Puedes subir fotos (JPG/PNG) o videos cortos (MP4/WebM) como evidencia visual.

### 5. Contactos de Apoyo
- Ve a la sección **"Contactos"**.
- Puedes guardar hasta **20 contactos personales** (familiares, amigos o compañeros de universidad).
- **Nombre:** Formato alfabético sin números.
- **Teléfono:** Formato telefónico válido (ej: `0991234567` o `+593991234567`).
- En caso de emergencia, podrás llamar con un solo toque desde la plataforma.

---

## 🛠️ 4. Módulo de Administrador

Los usuarios con rol **ADMINISTRADOR** disponen de herramientas para auditar la seguridad y alimentar el sistema de mapas.

### 1. Panel de Control (Dashboard)
- Resumen estadístico en tiempo real de alertas SOS, incidentes reportados, lugares seguros verificados y usuarios activos.

### 2. Gestión de Reportes y Visor de Evidencias
- Muestra el historial completo de alertas e incidentes recibidos.
- **Evidencia Adjunta:** Cada reporte muestra miniaturas de las imágenes o videos adjuntados por los estudiantes.
- **Visor Modal (Lightbox):** Haz clic sobre cualquier miniatura para ver la imagen en tamaño completo o reproducir el video de evidencia.

### 3. Editor de Ubicaciones en Google Maps
- Permite dar de alta o corregir las coordenadas (Latitud y Longitud) de los lugares de la universidad.
- Haz clic directo sobre el mapa de Google Maps para capturar las coordenadas exactas.

### 4. Editor de Rutas Seguras
- Permite seleccionar un Origen y un Destino y marcar puntos intermedios sobre las aceras y cruces de la ciudad.
- La ruta trazada se guardará en la base de datos MySQL y se utilizará para guiar a los estudiantes de forma segura.

### 5. Gestión de Usuarios y Permisos
- Permite consultar el listado de usuarios, modificar roles (Estudiante / Administrador) y gestionar cuentas registradas.

---

## ❓ 5. Preguntas Frecuentes y Soporte

- **¿Qué hago si olvidé mi contraseña?**
  Contacta a Soporte TI a través de la opción en el login o solicita la restauración a un Administrador del sistema.
- **¿Es obligatorio usar el GPS?**
  No es obligatorio, pero se recomienda activarlo para que las alertas de pánico incluyan tus coordenadas exactas.
- **¿Qué tipo de correo puedo usar?**
  Solo se permiten correos institucionales terminados en `@uide.edu.ec`.

# Manual de uso de Footy IQ

**Proyecto:** Footy IQ  
**Tipo de documento:** Manual de usuario  
**Alumno:** Gregorio Ruiz López  
**Ciclo:** 2º DAM  
**Centro:** CES Lope de Vega  
**Curso académico:** 2025-2026  
**Aplicación:** Plataforma de análisis futbolístico

## Índice

1. Objetivo del manual
2. Requisitos previos
3. Puesta en marcha
4. Acceso desde Android
5. Apertura de Chrome para FotMob
6. Acceso y cuenta de usuario
7. Navegación general
8. Dashboard
9. Data Hub
10. Competition
11. Equipos
12. Player
13. Match
14. Favoritos
15. Ajustes y cierre de sesión
16. Mensajes de error y solución de problemas
17. Buenas prácticas de uso
18. Preparación de una demostración
19. Administración local para usuarios técnicos
20. Checklist final de uso

## 1. Objetivo del manual

Este manual explica cómo utilizar Footy IQ desde el punto de vista de un usuario final. La aplicación permite consultar información futbolística, importar competiciones, analizar equipos, jugadores y partidos, guardar favoritos y trabajar con datos persistidos en una base de datos local.

El documento está pensado para acompañar la defensa del proyecto y para que cualquier usuario pueda reproducir los flujos principales sin conocer la implementación interna.

## 2. Requisitos previos

Para ejecutar la aplicación en local se recomienda disponer de:

- Windows con PowerShell.
- Docker Desktop, si se desea levantar todo el sistema mediante contenedores.
- Java 21 y Maven, si se ejecuta el backend en modo desarrollo.
- Node.js y npm, si se ejecuta el frontend en modo desarrollo.
- Python 3 y las dependencias del scraper, si se ejecuta el scraper fuera de Docker.
- Google Chrome instalado, necesario para algunas consultas externas a FotMob.
- Conexión a Internet para obtener datos externos.
- Para acceso desde Android, el PC y el móvil deben estar conectados a la misma red local.

Puertos utilizados por defecto:

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8080/api`
- Scraper: `http://localhost:8001`
- MongoDB: `localhost:27017`

## 3. Puesta en marcha

### Opción A: Docker Compose

Desde la raíz del proyecto:

```powershell
docker compose up --build
```

Este comando levanta MongoDB, scraper, backend y frontend. Cuando todos los servicios estén activos, la aplicación estará disponible en:

```text
http://localhost:5173
```

### Opción B: Script de desarrollo

Desde la raíz del proyecto:

```powershell
powershell -ExecutionPolicy Bypass -File .\run-local.ps1
```

El script abre ventanas separadas para scraper, backend y frontend. Antes de usar esta opción conviene comprobar que MongoDB está disponible en el puerto `27017`.

### Opción C: Arranque completo en un clic

Desde la raíz del proyecto:

```powershell
.\abrir-footyiq.bat
```

Este lanzador comprueba MongoDB, abre Chrome para FotMob cuando es necesario, levanta los servicios y abre el frontend en el navegador.

### Comprobación de salud

Se puede comprobar el estado de los servicios en:

- Backend: `http://localhost:8080/api/public/health`
- Scraper: `http://localhost:8001/health`
- Navegador del scraper: `http://localhost:8001/browser/health`
- Aplicación: `http://localhost:5173`

## 4. Acceso desde Android

Footy IQ puede abrirse desde Android usando la IP local del PC que ejecuta la aplicación.

Pasos:

1. Levantar la aplicación en el PC.
2. Obtener la IP local del PC con `ipconfig`.
3. Abrir en Android `http://<IP_DEL_PC>:5173`.
4. Confirmar que PC y móvil están en la misma red.

Si la página no carga, se debe revisar el firewall de Windows y permitir tráfico entrante para los puertos `5173`, `8080` y `8001` en red privada. En Android no debe utilizarse `localhost`, ya que esa dirección apunta al propio móvil.

## 5. Apertura de Chrome para FotMob

FotMob puede mostrar una protección de Cloudflare antes de permitir la consulta de datos. Para resolverla, el scraper reutiliza una sesión real de Chrome abierta por el usuario.

Desde la raíz del proyecto:

```powershell
powershell -ExecutionPolicy Bypass -File .\scraper\launch_chrome.ps1
```

En la ventana de Chrome:

1. Entrar en `https://www.fotmob.com/`.
2. Completar la verificación si aparece.
3. Dejar Chrome abierto mientras se utiliza Footy IQ.

Después de este paso se puede volver a la aplicación y repetir la consulta o importación.

## 6. Acceso y cuenta de usuario

Al abrir Footy IQ aparece la pantalla de acceso. El usuario puede iniciar sesión o crear una cuenta.

Para iniciar sesión:

1. Introducir el nombre de usuario.
2. Introducir la contraseña.
3. Pulsar `Entrar`.

Para registrarse:

1. Pulsar `Regístrate`.
2. Indicar usuario, email y contraseña.
3. Pulsar `Crear cuenta`.

Si el login falla, la aplicación muestra un mensaje de error. En ese caso conviene revisar las credenciales, comprobar que el backend está activo o crear una cuenta si todavía no existe.

## 7. Navegación general

La barra superior permite acceder a las secciones principales:

- `Dashboard`: vista general del estado de la plataforma.
- `Match`: consulta y análisis de partidos.
- `Equipos`: consulta de equipos importados y gestión de equipos propios.
- `Player`: ficha individual de jugadores.
- `Competition`: análisis de competiciones importadas.
- `Data Hub`: importación y administración de datos persistidos.
- `Favoritos`: elementos guardados por el usuario.

En la parte derecha de la barra superior se encuentran los ajustes visuales y el menú de cuenta.

## 8. Dashboard

El Dashboard resume la actividad principal de la plataforma:

- Partidos recientes.
- Próximos partidos.
- Indicadores de actividad.
- Estado general de servicios.

Uso habitual:

1. Entrar en `Dashboard`.
2. Revisar los paneles de resumen.
3. Usar la actualización si se necesita refrescar la información.

Si el scraper no responde, la aplicación conserva la última información disponible siempre que sea posible.

## 9. Data Hub

`Data Hub` es la zona de importación y administración de datos.

Funciones principales:

- Consultar el catálogo de ligas soportadas.
- Importar una liga a MongoDB.
- Ver competiciones almacenadas.
- Revisar el historial de importaciones.
- Eliminar una liga importada y sus datos asociados.

Proceso recomendado para importar una liga:

1. Entrar en `Data Hub`.
2. Seleccionar una liga del catálogo.
3. Comprobar que el scraper está activo.
4. Si FotMob solicita verificación, abrir Chrome con `.\scraper\launch_chrome.ps1`.
5. Pulsar la acción de importar.
6. Esperar a que el proceso finalice sin recargar la página.
7. Revisar el historial de importaciones.
8. Comprobar que la competición aparece como almacenada.

La importación guarda competiciones, partidos, equipos y jugadores obtenidos a través del scraper.

## 10. Competition

La sección `Competition` permite consultar información de una competición importada.

Uso habitual:

1. Entrar en `Competition`.
2. Seleccionar una competición almacenada.
3. Revisar clasificación, equipos y partidos disponibles.
4. Abrir equipos o partidos relacionados.
5. Utilizar la información como punto de partida para análisis posteriores.

La clasificación se calcula a partir de partidos almacenados con marcador disponible. Si faltan datos, la tabla puede aparecer parcial; esto depende de la información devuelta por el proveedor externo.

## 11. Equipos

La sección `Equipos` permite consultar equipos importados y gestionar equipos propios.

### Equipos importados

Uso habitual:

1. Entrar en `Equipos`.
2. Seleccionar una competición o equipo disponible.
3. Consultar plantilla, entrenador, forma, partidos y estadísticas.
4. Abrir la ficha de jugadores desde la plantilla.
5. Guardar equipos como favoritos.

### Equipos propios

Los equipos propios permiten crear plantillas independientes de los datos externos.

Datos principales:

- Nombre del equipo.
- Escudo opcional.
- Visibilidad compartida.
- Lista de jugadores.
- Dorsal, posición, pierna preferida, fecha de nacimiento, notas y foto opcional para cada jugador.

## 12. Player

La sección `Player` muestra la ficha individual de un jugador.

Información disponible:

- Datos generales.
- Equipo asociado.
- Estadísticas principales.
- Próximos partidos.
- Historial o competiciones relacionadas, si el proveedor las devuelve.

Uso habitual:

1. Abrir un jugador desde `Match`, `Equipos` o una URL con parámetro `id`.
2. Revisar sus indicadores.
3. Navegar hacia su equipo o partidos relacionados.
4. Guardar el jugador como favorito.

## 13. Match

La sección `Match` permite consultar datos detallados de un partido.

Uso habitual:

1. Entrar en `Match`.
2. Seleccionar un partido importado o acceder mediante identificador.
3. Revisar marcador, equipos, alineaciones, eventos del partido, estadísticas y gráficos disponibles.
4. Navegar desde nombres de jugadores hacia sus fichas.
5. Guardar el partido como favorito cuando proceda.
6. Exportar información si la vista ofrece esa opción.

La información puede venir de datos importados o de consultas directas al scraper, según el identificador y el origen de navegación.

## 14. Favoritos

La sección `Favoritos` reúne jugadores, equipos y partidos guardados por el usuario.

Uso habitual:

1. Guardar un elemento desde su ficha o vista principal.
2. Entrar en `Favoritos`.
3. Abrir el elemento desde su tarjeta.
4. Quitar el favorito cuando ya no sea necesario.

Los favoritos se guardan por usuario y evitan duplicados para el mismo tipo e identificador externo.

## 15. Ajustes y cierre de sesión

La barra superior incluye un menú de ajustes con:

- Autoactualización de estado.
- Densidad normal o compacta.

El menú de cuenta permite cerrar sesión. Al hacerlo se elimina el token local y la aplicación vuelve a la pantalla de acceso.

## 16. Mensajes de error y solución de problemas

### No se pudo autenticar

Causa probable: usuario inexistente, contraseña incorrecta o backend no disponible.  
Solución: comprobar credenciales, registrarse si no existe cuenta y verificar `http://localhost:8080/api/public/health`.

### Backend caído

Causa probable: Spring Boot no está iniciado o el puerto `8080` está ocupado.  
Solución: levantar el backend o ejecutar `.\reiniciar-backend.bat`.

### MongoDB caído

Causa probable: MongoDB no escucha en `27017`.  
Solución: iniciar MongoDB localmente o con Docker.

### Scraper caído

Causa probable: FastAPI no está iniciado o no puede acceder a FotMob.  
Solución: revisar `http://localhost:8001/health`, conexión a Internet y logs del scraper.

### Importación fallida

Causa probable: error del scraper, liga no disponible, cambio externo en FotMob o bloqueo temporal de Cloudflare.  
Solución: repetir la importación, revisar el historial en `Data Hub`, comprobar logs y abrir Chrome con `.\scraper\launch_chrome.ps1` si procede.

### No aparecen datos en una ficha

Causa probable: identificador incorrecto, competición no importada o datos no disponibles en el proveedor externo.  
Solución: importar la competición desde `Data Hub` o navegar desde enlaces internos de la aplicación.

## 17. Buenas prácticas de uso

- Importar primero las competiciones necesarias desde `Data Hub`.
- Usar favoritos para preparar el seguimiento de equipos, partidos y jugadores.
- Comprobar el estado de backend, MongoDB y scraper antes de una demostración.
- Evitar depender de una importación en directo si la conexión es inestable.
- Mantener Chrome abierto si se está utilizando el flujo de FotMob con verificación.
- No compartir el `JWT_SECRET` de desarrollo en entornos reales.

## 18. Preparación de una demostración

Checklist previo:

- Levantar todos los servicios.
- Abrir `http://localhost:8080/api/public/health`.
- Confirmar que backend, MongoDB y scraper están activos.
- Abrir `http://localhost:5173`.
- Iniciar sesión con un usuario de prueba.
- Tener al menos una competición importada.
- Guardar dos o tres favoritos.
- Probar previamente la navegación entre `Data Hub`, `Competition`, `Equipos`, `Player` y `Match`.

Recorrido recomendado:

1. Login.
2. Dashboard.
3. Data Hub.
4. Competition.
5. Equipo.
6. Jugador.
7. Match.
8. Favoritos.

## 19. Administración local para usuarios técnicos

Arrancar con Docker:

```powershell
docker compose up --build
```

Parar servicios Docker:

```powershell
docker compose down
```

Arrancar en modo desarrollo:

```powershell
powershell -ExecutionPolicy Bypass -File .\run-local.ps1
```

Arrancar con ejecutable:

```powershell
.\abrir-footyiq.bat
```

Reiniciar backend:

```powershell
.\reiniciar-backend.bat
```

Arrancar scraper manualmente:

```powershell
cd scraper
python -m uvicorn app.main:app --port 8001
```

## 20. Checklist final de uso

Antes de considerar una sesión terminada:

- El usuario correcto ha iniciado sesión.
- Los servicios aparecen como activos.
- Las competiciones necesarias están importadas.
- Los equipos, jugadores y partidos consultados tienen información suficiente.
- Los favoritos relevantes están guardados.
- El informe o material de consulta se ha revisado antes de presentarlo.
- La sesión se ha cerrado si el equipo es compartido.

Con este flujo, Footy IQ queda preparado para consulta, análisis y presentación académica.

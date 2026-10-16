# TecnoTrack — Sistema de control de préstamos tecnológicos

## 1. Descripción del proyecto

TecnoTrack es una solución tecnológica diseñada para gestionar el inventario de equipos y controlar sus préstamos y devoluciones. Permite consultar la disponibilidad de los activos, conocer su estado e identificar los movimientos realizados.

Además, incorpora una función de recomendación inteligente que propone equipos alternativos cuando el solicitado no se encuentra disponible, considerando el tipo de equipo y su estado.

## 2. Problema que resuelve

La falta de control sobre los equipos tecnológicos puede generar confusiones acerca de cuáles están disponibles, cuáles se encuentran prestados, cuáles están dañados y cuáles tienen devoluciones pendientes.

TecnoTrack busca centralizar esta información y facilitar el seguimiento de los equipos, reduciendo errores y mejorando el control del inventario.

## 3. Objetivo general

Desarrollar una solución que permita administrar el inventario tecnológico, registrar préstamos y devoluciones, consultar el historial de movimientos y recomendar alternativas disponibles cuando un equipo no pueda prestarse.

## 4. Funcionalidades principales

- **Inventario:** consulta de los equipos registrados y sus estados.
- **Registro de préstamos:** asignación de equipos a sus responsables.
- **Registro de devoluciones:** actualización del estado del préstamo y del equipo.
- **Historial de movimientos:** consulta de los préstamos y devoluciones registrados.
- **Recomendaciones inteligentes:** sugerencia de equipos alternativos según el tipo y la disponibilidad.

## 5. Reglas de negocio

1. No se permite prestar un equipo que ya tenga un préstamo activo.
2. No se permite prestar equipos dañados o inhabilitados.
3. No se permite registrar una devolución si no existe un préstamo activo.
4. Al registrar una devolución válida, el sistema debe actualizar el estado correspondiente del equipo.
5. Las recomendaciones deben considerar equipos compatibles que estén disponibles.
6. Antes de confirmar un nuevo préstamo, se debe verificar nuevamente la disponibilidad del equipo.

## 6. Tecnologías utilizadas

- Java: [indicar si se utiliza para el backend].
- HTML: estructura de la interfaz web.
- CSS: estilos y diseño visual.
- JavaScript: interactividad y validaciones de la interfaz.
- Inteligencia artificial: [indicar la herramienta o el mecanismo utilizado realmente].
- Almacenamiento: [indicar la base de datos o mecanismo de persistencia utilizado].

## 7. Flujo general del sistema

1. El encargado consulta el inventario.
2. Selecciona el equipo que necesita prestar.
3. El sistema verifica su disponibilidad y estado.
4. Si cumple las reglas, se registra el préstamo.
5. Si no está disponible, el sistema puede recomendar una alternativa compatible.
6. Cuando el equipo regresa, el encargado registra la devolución.
7. El sistema actualiza el estado y registra el movimiento en el historial.

## 8. Instrucciones de instalación y ejecución

[Completar con los pasos reales para instalar y ejecutar el proyecto.]

1. Clonar o descargar el repositorio.
2. Abrir el proyecto en el entorno de desarrollo correspondiente.
3. Instalar o configurar las dependencias necesarias.
4. Iniciar el backend, si aplica.
5. Ejecutar la interfaz web.
6. Abrir la aplicación y realizar las pruebas.

## 9. Pruebas funcionales

- Consultar equipos disponibles.
- Intentar prestar un equipo disponible.
- Intentar prestar un equipo que ya está prestado.
- Intentar prestar un equipo dañado o inhabilitado.
- Registrar la devolución de un préstamo activo.
- Intentar devolver un equipo sin préstamo activo.
- Consultar el historial de movimientos.
- Solicitar una recomendación cuando el equipo requerido no esté disponible.

## 10. Integrantes

- [Integrante 1] — [Responsabilidad].
- [Integrante 2] — [Responsabilidad].
- [Integrante 3] — [Responsabilidad].
- [Integrante 4] — Documentación y apoyo en pruebas.

## 11. Alcance y limitaciones

La solución implementa las funcionalidades que el equipo haya logrado desarrollar y validar durante la hackathon. Las recomendaciones inteligentes, la persistencia de los datos y las integraciones externas dependen de los componentes efectivamente implementados.

## 12. Conclusión

TecnoTrack propone una forma organizada de gestionar los préstamos tecnológicos, mejorar la trazabilidad de los equipos y facilitar la búsqueda de alternativas disponibles. Su propósito es contribuir a una administración más clara, eficiente y confiable del inventario tecnológico.
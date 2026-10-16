# Integración frontend de TecnoTrack

## Estado y alcance

Tras actualizar `main`, el proyecto incluye el backend Java de la compañera en `backend/TecnoTrack/` y el frontend en `fronted/`. La aplicación sigue arrancando explícitamente en **modo simulado**: la fusión conserva ambos trabajos, pero aún no adapta ni verifica el transporte contra Java. No se modificó el backend ni se instalaron dependencias.

`api.js` centraliza Fetch y valida el contrato interno; `api-mock.js` proporciona respuestas en memoria; `api-config.js` selecciona el modo; `app.js` conecta las vistas existentes. El módulo funcional `inventario.js` de la compañera conserva sus funciones de búsqueda, filtros, estados y evento `tecnotrack:solicitar-prestamo`, y ahora recibe la instantánea de la API mediante `window.TecnoTrackInventario.actualizar()`. Se añadieron sus conexiones para SVG, paginación y alternativas. Se retiraron los filtros y el renderizado duplicados de `app.js`. Los estilos originales, `datos.js` y `prestamo.js` se conservan.

La conexión mínima a la interfaz incluye selección de equipos, filtros existentes, formulario con responsable, devolución por préstamo activo, contadores existentes e historial. No constituye el desarrollo completo de las demás partes del frontend.

## Probar localmente

Abrir `index.html` en la raíz o `fronted/index.html` directamente permite probar la simulación sin instalar herramientas. La entrada de la raíz redirige a `fronted/index.html`, conservando parámetros y sección, para mantener los accesos anteriores después del traslado del frontend. La aplicación y sus scripts permanecen únicamente en `fronted/`; los scripts se cargan una única vez con `defer`. La fuente de Google existente requiere Internet; las operaciones simuladas no. Las pruebas se ejecutan desde la raíz y comprueban tanto la entrada anterior como el frontend fusionado.

1. Confirmar el aviso de modo simulado y el inventario: 24 equipos, 14 disponibles, 4 prestados y 5 dañados (también hay 1 inhabilitado).
2. Filtrar por código, tipo, ubicación y estado; limpiar los filtros y probar una búsqueda sin coincidencias.
3. Seleccionar un equipo disponible y prestable, completar responsable y documento y confirmar el préstamo. Cancelar la confirmación no debe enviar ninguna operación.
4. Comprobar cambios en inventario, contadores, selector e historial.
5. Seleccionar Devolución y un préstamo activo; confirmar y revisar las mismas vistas.
6. En el equipo PC-APO-003, consultar alternativas. El fixture contiene PC-APO-001, PC-SPU-001, PC-SPU-002, PC-ART-001 y PC-HOU-001, en ese orden; solo devuelve los que siguen disponibles y prestables. Otros casos devuelven lista vacía; no se calcula un algoritmo.
7. Recargar: las operaciones simuladas se pierden deliberadamente. No se modifican `datos.js`, el backend ni almacenamiento persistente.

Pruebas de transporte y simulación sin dependencias: `node --test tests/api.test.cjs`.

## Conectar el backend Java incorporado: adaptación pendiente

Solicitar a la Persona A: URL base, rutas, métodos HTTP, cuerpos, formatos de respuesta/error, estados usados, autenticación y orígenes CORS permitidos. Servir el frontend por HTTP con una herramienta ya disponible si se necesita autorizar un origen concreto.

No basta cambiar `modo` a `real`. Primero deben adaptarse las diferencias del contrato Java descritas al final de este documento y probarlas. Después se configurará `fronted/js/api-config.js`, incluyendo URL base y rutas. Los endpoints permanecen a `null` para evitar activar una integración incompatible. Las funciones que incluyan identificadores en URLs deben usar `encodeURIComponent`.

El transporte preparado usa GET para consultas y POST con JSON para operaciones. Si el backend confirma otros métodos o nombres de campos, adaptar `api.js` antes de conectarlo. No existe autenticación configurada: no se envían credenciales entre orígenes ni cabeceras de autorización. CORS se configura en el servidor, no se resuelve con `no-cors`.

No se cambia al mock ante un fallo de red, timeout o HTTP. Las rutas sin configurar producen un error visible y no envían una petición.

## Contrato interno propuesto, pendiente de acordar

Los nombres siguientes son operaciones del adaptador, **no URLs existentes**. Las consultas esperan arreglos JSON directos; si el servidor usa envoltorios o paginación, normalizarlos en `api.js`.

| Operación | Entrada | Respuesta interna |
| --- | --- | --- |
| `obtenerEquipos()` | Ninguna | `[{id,tipo,marca,ubicacion,estado,prestable}]` |
| `obtenerPrestamos()` | Ninguna | `[{id,equipoId,responsable,identificacion,fechaPrestamo,estado,fechaDevolucion}]` |
| `obtenerHistorial()` | Ninguna | `[{id,equipoId,responsable,tipo,fecha}]` |
| `obtenerRecomendaciones(equipoId)` | Identificador del equipo | `[{equipoId,motivo}]`, calculado por el backend |
| `registrarPrestamo(datos)` | `{equipoId,responsable,identificacion}` | Objeto de confirmación o HTTP 204 |
| `devolverPrestamo(id)` | Identificador del préstamo; cuerpo `{}` | Objeto de confirmación o HTTP 204 |

Los campos textuales obligatorios se validan como cadenas no vacías; `prestable` es booleano e IDs de préstamos/movimientos pueden ser números o cadenas. Fechas: cadenas ISO recomendadas. Estados actuales: `DISPONIBLE`, `PRESTADO`, `DAÑADO`, `INHABILITADO`; préstamos `ACTIVO` y `DEVUELTO`; movimientos `PRESTAMO` y `DEVOLUCION`.

Una consulta sin resultados debe devolver `[]`. HTTP 204 se acepta solo en escrituras; una consulta con 204/JSON inválido o estructura inesperada falla explícitamente. Las confirmaciones de escritura aceptan objeto JSON o 204; se vuelven a consultar los datos en lugar de asumir el resultado del objeto.

## Errores y consistencia

`ErrorAPI` expone `message`, `codigo` y `status`. Códigos internos: `CONFIGURACION`, `HTTP`, `CONEXION`, `TIEMPO_AGOTADO`, `RESPUESTA_INVALIDA`, `SIMULACION`. Se usan mensajes propios para 400, 401, 403, 404, 409, 422 y otros estados; no se insertan mensajes arbitrarios del servidor en HTML.

Timeout predeterminado: 10 segundos, incluyendo lectura de la respuesta. No se reintentan escrituras automáticamente: ante un fallo, el servidor podría haber registrado la operación. El formulario queda bloqueado hasta actualizar los datos. Si la escritura se confirma pero la recarga falla, se informa explícitamente que no se debe repetir la operación.

La carga de equipos, préstamos e historial se aplica en conjunto. Si falla, se conservan los últimos datos visibles con advertencia y se bloquea el formulario. El botón Actualizar datos permite recuperarse. Los datos se muestran con `textContent` y nodos DOM, sin interpolar HTML recibido.

## Pendientes y límites

- Verificar contratos, autenticación y errores con el backend real.
- Probar CORS y el ciclo completo contra el servidor Java.
- Completar con las responsables de otras partes la columna de estado del historial.
- Ampliar la revisión de teclado, lectores de pantalla y dispositivos físicos. Se verificaron capturas y operaciones en Edge headless con tamaños de escritorio y móvil; esto no sustituye las pruebas con usuarios ni con el backend Java.
- La simulación solo facilita pruebas de interfaz; sus comprobaciones mínimas no definen reglas definitivas de negocio.

Todos los cambios son locales. No ejecutar commit, push ni crear Pull Requests.

## Navegación y presentación

La mejora visual utiliza `css/interfaz.css` como capa sobre los estilos originales y `js/navegacion.js` para mostrar una única vista. Los enlaces `#dashboard`, `#inventario`, `#prestamos`, `#devoluciones`, `#historial` y `#recomendaciones` funcionan al abrirlos directamente y con Atrás/Adelante. Préstamos y devoluciones reutilizan la sección `prestamos` y el único controlador de envío. El evento `tecnotrack:navegacion` sincroniza el selector de operación; cambiar ese selector actualiza la ruta. No se recarga el documento ni se pierden los movimientos simulados al cambiar de sección. No son documentos HTML separados.

El inventario muestra ocho equipos por página; al cambiar filtros vuelve a la primera. Las tablas permiten desplazamiento dentro de su propio contenedor. En móvil la navegación se sitúa arriba y admite desplazamiento horizontal. Se conservan el foco visible, el enlace para saltar al contenido y `aria-current` en la opción activa.

El resumen incluye equipos dañados, inhabilitados y préstamos activos pendientes de devolución; estos últimos no representan necesariamente préstamos vencidos. Los estados se distinguen por texto y color.

Pruebas locales: `node --test tests/*.test.cjs`. La prueba de navegación verifica visibilidad exclusiva, enlaces directos, cambios de ruta, opción activa y recuperación de rutas desconocidas mediante un DOM de prueba; no sustituye una revisión visual en navegador.

## Recomendaciones: prioridad pendiente de acordar con la Persona A

El endpoint Java de recomendaciones existe, pero todavía no está configurado en el frontend ni garantiza el orden de similitud solicitado. El mock contiene una lista predefinida de cinco referencias existentes para PC-APO-003, sin algoritmo. El frontend conserva el orden relativo recibido y presenta hasta cinco candidatos elegibles; no calcula similitud, compatibilidad, puntuaciones ni candidatos nuevos.

**Requisito solicitado para el backend, todavía pendiente de confirmación:** devolver las alternativas ordenadas por:

1. Mismo tipo, misma ubicación y misma marca.
2. Mismo tipo y ubicación, diferente marca.
3. Mismo tipo, diferente ubicación.
4. Otros equipos compatibles, exclusivamente cuando el backend confirme su validez.

La Persona A debe confirmar que cada elemento devuelto es una alternativa válida (incluidos los de otro tipo), que todos están disponibles y son prestables, y cómo se resuelven empates dentro de cada grupo. El orden solicitado y esa garantía deben quedar documentados y probarse con respuestas reales antes de habilitar un destacado de prioridad. No basta la posición del elemento en una respuesta cuyo orden se desconoce.

### Presentación e integración actuales

- Solo se muestran candidatos incluidos por el servicio y encontrados en el inventario cargado con `estado === "DISPONIBLE"` y `prestable === true`; se excluye el equipo solicitado. Una referencia desconocida se omite porque no se puede verificar su disponibilidad.
- Este control es de presentación: el servidor debe volver a validar disponibilidad y compatibilidad al registrar el préstamo. La información del inventario es una instantánea y puede cambiar en otro cliente.
- Las tarjetas muestran SVG del tipo, nombre opcional (`nombre` en la recomendación o en el equipo), código, tipo, marca, ubicación, disponibilidad y motivo. Los detalles del equipo se toman del inventario actual; no se inventan campos ausentes. `equipoId` y `motivo` siguen siendo los campos obligatorios del contrato interno vigente. El botón «Seleccionar equipo» precarga el formulario sin registrar automáticamente el préstamo.
- Si no quedan candidatos verificables, se muestra «No hay alternativas disponibles para este equipo».
- La selección respeta los bloqueos de carga y envío y vuelve a comprobar la instantánea local. Actualizar datos elimina las alternativas anteriores e invalida consultas de recomendaciones pendientes.
- La constante `recomendacionesOrdenadasPorPrioridad` de `js/app.js` permanece en `false`. Solo tras confirmar y verificar el contrato podrá activarse para destacar la primera alternativa visible como «Mejor coincidencia», exclusivamente en modo real. En modo simulado, la primera tarjeta se identifica como «Primera opción de prueba». No se ordenan ni puntúan los elementos ni se presenta el fixture como una prioridad real.
- Se informa expresamente cuando solo hay una o dos alternativas. Nunca se completan resultados con equipos ajenos a la respuesta ni se fuerza un mínimo de tres.

### Información pendiente del contrato

Confirmar ruta y método, orden garantizado o metadatos explícitos de prioridad, significado de compatibilidad, formato del nombre y detalles del equipo, estados y condición de prestable, comportamiento sin resultados y errores. Si el backend devuelve equipos completos en lugar de referencias al inventario, acordar y adaptar el contrato en `api.js` antes de utilizarlos; no se presupone ese formato.

### Verificación manual de esta presentación

Consultar PC-APO-003: deben mostrarse inicialmente cinco tarjetas, con PC-APO-001 como «Primera opción de prueba». Seleccionarlo debe abrir el formulario, sin aumentar los préstamos. Prestar cada candidato y repetir la consulta reduce el total hasta cero; devolverlos permite mostrarlos de nuevo. Otros ejemplos sin fixture muestran el estado vacío. La respuesta real debe probarse además con candidatos no prestables o no disponibles y referencias desconocidas; el orden de los candidatos visibles debe coincidir con el recibido.

## Verificación del rediseño local

El diseño toma de la referencia el menú azul oscuro, las acciones azules, los indicadores con SVG y las superficies claras. Se conservan los datos existentes: no se añaden nombres, marcas, fotografías, usuarios ni controles de notificaciones/configuración sin funcionalidad. Las alternativas permanecen en su vista independiente.

Ejecutar `node --test tests/api.test.cjs tests/navegacion.test.cjs` para las seis pruebas automatizadas. `node tests/navegador.cjs` utiliza el Edge ya instalado en Windows y las APIs nativas de Node (sin dependencias nuevas) para verificar inventario, filtros, paginación, alternativas, selección sin registro, cancelación, validación, bloqueo de doble envío, préstamo, devolución, historial, enlaces directos y Atrás/Adelante. La prueba arranca un servidor efímero ligado a 127.0.0.1, usa un perfil temporal y lo cierra al terminar. No contacta un backend Java ni publica cambios.

Las capturas se guardan en una carpeta temporal cuya ruta imprime la prueba. Se comprueban tamaños de 1536×1024 y 390×844 y la ausencia de desbordamiento horizontal global; las tablas y el menú móvil conservan su propio desplazamiento. La ejecución requiere una versión moderna de Node con Fetch y WebSocket nativos y el Edge existente en la ruta indicada por el script. No se instalan herramientas automáticamente.

## Contratos Java comprobados en el código después de la fusión

Fuente: `backend/TecnoTrack/src/main/java/com/mycompany/tecnotrack/Controlador/ServidorHTTP.java`. El servidor declara el puerto 8081. Estas rutas existen en el código; no se afirma que se hayan probado con un servidor Java en ejecución.

| Operación Java | Método y ruta | Solicitud / respuesta observadas |
| --- | --- | --- |
| Equipos | GET `/api/equipos` | Array con `id`, `tipo`, `marca`, `sistemaOperativo`, `ubicacion`, `estado`, `prestable` |
| Préstamos | GET `/api/prestamos` | Array; no contiene `identificacion` |
| Prestar | POST `/api/prestamos` | Recibe `equipoId`, `responsable`; devuelve 201 y `{mensaje,prestamo}` |
| Devolver | POST `/api/devoluciones` | Recibe `equipoId`, `observacion`; devuelve 200 y `{mensaje,prestamo}` |
| Historial | GET `/api/movimientos` | Array; incluye `observacion` |
| Alternativas | GET `/api/recomendaciones?equipoId=...` | Array de equipos completos, sin `equipoId` ni `motivo` en cada alternativa |

Diferencias pendientes de adaptar y acordar:

- Java utiliza tipos `COMPUTADOR_ESCRITORIO`, `MONITOR`, `TECLADO`, `MOUSE`; el frontend presenta `Computador`, `Monitor`, `Teclado`, `Mouse`.
- Java utiliza `DANADO`; el modelo visual actual utiliza `DAÑADO`.
- El documento del responsable existe en el formulario/mock, pero no se recibe ni persiste en estos endpoints Java. No debe afirmarse que se guarda realmente.
- La devolución Java identifica el equipo, mientras la interfaz selecciona un préstamo activo. La futura adaptación debe obtener el `equipoId` de ese préstamo.
- Las recomendaciones reales no incluyen motivo ni prioridad. `TecnoTrackService.recomendarAlternativas()` devuelve otros equipos del mismo tipo, disponibles y prestables en el orden de recorrido; no ordena por ubicación y marca. El criterio solicitado sigue pendiente de la Persona A. No se cambió este algoritmo.
- Los errores del servidor usan `{error: mensaje}` y las validaciones de negocio devuelven 400. La capa actual muestra mensajes HTTP propios.
- El servidor declara CORS con origen `*`, métodos GET/POST/OPTIONS y cabecera Content-Type. Falta verificarlo en ejecución y confirmar requisitos de autenticación si se incorporan.

El backend y el README se conservaron como llegaron del remoto. Para esta fusión se verificó el frontend combinado en modo simulado; la conexión real requiere la adaptación anterior y un entorno Java disponible. El stash original se conserva como respaldo hasta que el usuario decida retirarlo.

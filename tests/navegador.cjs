/* Prueba de integración en Edge headless con Node, sin paquetes adicionales.
 * Ejecutar: node tests/navegador.cjs
 * Las capturas y el perfil aislado se guardan en el directorio temporal del sistema.
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');

const raiz = path.resolve(__dirname, '..');
const ejecutable = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const pausa = ms => new Promise(resolve => setTimeout(resolve, ms));
const probarContratoJava = process.argv.includes('--contrato');

/** Prueba la interfaz con mock o con un servidor HTTP de respuestas controladas.
 * El segundo escenario verifica el contrato inspeccionado, no ejecuta Java.
 * @returns {Promise<void>} Rechaza si falla una comprobación o el navegador.
 */
async function verificarInterfaz() {
    if (!fs.existsSync(ejecutable)) throw new Error('Esta prueba requiere el Edge existente de Windows; no instala navegadores.');
    const temporal = fs.mkdtempSync(path.join(os.tmpdir(), 'tecnotrack-verificacion-'));
    const tipos = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };
    const escenarioJava = probarContratoJava ? require('./servidor-java-fixture.cjs').crearEscenarioJava() : null;
    const servidor = http.createServer((peticion, respuesta) => {
        try {
            if (escenarioJava && escenarioJava.manejar(peticion, respuesta)) return;
            const ruta = decodeURIComponent(new URL(peticion.url, 'http://localhost').pathname);
            const archivo = path.resolve(raiz, '.' + (ruta === '/' ? '/index.html' : ruta));
            if (!archivo.startsWith(raiz + path.sep) || !tipos[path.extname(archivo)]) {
                respuesta.writeHead(404).end();
                return;
            }
            fs.readFile(archivo, (error, contenido) => {
                respuesta.writeHead(error ? 404 : 200, { 'Content-Type': (tipos[path.extname(archivo)] || 'text/plain') + '; charset=utf-8' });
                // La configuración servida solo cambia en la prueba; no se escribe en disco.
                const cuerpo = !error && archivo.endsWith(path.join('js', 'api-config.js'))
                    ? probarContratoJava
                        ? contenido.toString('utf8').replace('http://localhost:8081/api/', `http://127.0.0.1:${servidor.address().port}/api/`)
                        : contenido.toString('utf8').replace('modo: "real"', 'modo: "simulado"')
                    : contenido;
                respuesta.end(error ? '' : cuerpo);
            });
        } catch { respuesta.writeHead(400).end(); }
    });
    await new Promise(resolve => servidor.listen(0, '127.0.0.1', resolve));
    const navegador = spawn(ejecutable, ['--headless=new', '--disable-gpu', '--no-first-run', '--no-sandbox',
        '--remote-debugging-port=0', '--user-data-dir=' + temporal, 'about:blank'], { windowsHide: true, stdio: ['ignore', 'ignore', 'pipe'] });
    let salida = '';
    navegador.stderr.on('data', chunk => { salida += chunk; });
    let falloInicio;
    navegador.on('error', error => { falloInicio = error; });
    let socket;
    try {
        let puerto;
        for (let intento = 0; intento < 100; intento++) {
            if (falloInicio) throw falloInicio;
            const coincidencia = salida.match(/DevTools listening on ws:\/\/127\.0\.0\.1:(\d+)/);
            if (coincidencia) { puerto = coincidencia[1]; break; }
            await pausa(100);
        }
        assert.ok(puerto, 'El navegador debe habilitar el protocolo de pruebas');
        const paginas = await (await fetch(`http://127.0.0.1:${puerto}/json/list`)).json();
        socket = new WebSocket(paginas.find(pagina => pagina.type === 'page').webSocketDebuggerUrl);
        await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }); });
        let identificador = 0;
        const pendientes = new Map();
        const errores = [];
        socket.addEventListener('message', evento => {
            const mensaje = JSON.parse(evento.data);
            if (mensaje.method === 'Runtime.exceptionThrown') errores.push(mensaje.params.exceptionDetails.text);
            const pendiente = pendientes.get(mensaje.id);
            if (!pendiente) return;
            pendientes.delete(mensaje.id);
            clearTimeout(pendiente.timer);
            if (mensaje.error) pendiente.reject(new Error(mensaje.error.message));
            else pendiente.resolve(mensaje.result);
        });
        const enviar = (method, params = {}) => new Promise((resolve, reject) => {
            const id = ++identificador;
            const timer = setTimeout(() => { pendientes.delete(id); reject(new Error('Timeout CDP: ' + method)); }, 10000);
            pendientes.set(id, { resolve, reject, timer });
            socket.send(JSON.stringify({ id, method, params }));
        });
        const evaluar = async expression => {
            const resultado = await enviar('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
            if (resultado.exceptionDetails) throw new Error(JSON.stringify(resultado.exceptionDetails));
            return resultado.result.value;
        };
        const esperar = async expression => {
            for (let intento = 0; intento < 100; intento++) {
                if (await evaluar(expression)) return;
                await pausa(50);
            }
            throw new Error('Condición no alcanzada: ' + expression);
        };
        const capturar = async nombre => {
            await evaluar('new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))');
            const captura = await enviar('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
            fs.writeFileSync(path.join(temporal, nombre + '.png'), Buffer.from(captura.data, 'base64'));
        };
        await enviar('Runtime.enable');
        await enviar('Page.enable');
        await enviar('Emulation.setDeviceMetricsOverride', { width: 1536, height: 1024, deviceScaleFactor: 1, mobile: false });
        await enviar('Page.navigate', { url: `http://127.0.0.1:${servidor.address().port}/#inventario` });
        await esperar(`document.getElementById('total-equipos')?.textContent === '${probarContratoJava ? 5 : 24}'`);
        assert.equal(await evaluar("location.pathname.endsWith('/fronted/index.html') && location.hash === '#inventario'"), true, 'La entrada anterior debe conservar la sección y abrir el frontend fusionado');
        if (probarContratoJava) {
            assert.equal(await evaluar('window.TecnoTrackConfig.modo'), 'real');
            assert.equal(await evaluar("document.querySelectorAll('#cuerpoInventario tr').length"), 5);
            assert.equal(await evaluar("document.getElementById('totalEquipos').textContent"), '5');
            await evaluar("document.getElementById('buscarEquipo').value = 'PC-HOU-001'; document.getElementById('buscarEquipo').dispatchEvent(new Event('input')); document.querySelector('#cuerpoInventario button').click()");
            await esperar("document.querySelectorAll('.alternativa-card').length === 1");
            assert.equal(await evaluar("document.querySelector('.alternativa-prioridad') === null"), true);
            assert.match(await evaluar("document.querySelector('.alternativa-motivo').textContent"), /no proporciona/);
            await evaluar("document.querySelector('.alternativa-card button').click()");
            await esperar("location.hash === '#prestamos' && document.getElementById('codigo-equipo').value === 'PC-APO-001'");
            assert.equal(await evaluar("document.getElementById('documento-usuario').required"), false);
            assert.equal(await evaluar("document.getElementById('documento-usuario').parentElement.hidden"), true);
            assert.equal(escenarioJava.escrituras.length, 0);
            await evaluar("window.confirm = () => true; document.getElementById('nombre-responsable').value = 'Prueba de contrato'; document.getElementById('form-prestamo').requestSubmit()");
            await esperar("document.getElementById('equipos-prestados').textContent === '1' && !document.getElementById('actualizar-datos').disabled");
            assert.match(await evaluar("document.getElementById('estado-historial').textContent"), /No se pudo actualizar/);
            assert.match(await evaluar("document.getElementById('mensaje-alerta').textContent"), /Operación confirmada/);
            assert.equal(await evaluar("document.querySelector('#form-prestamo button').disabled"), false, 'Un fallo del historial no debe bloquear otras operaciones');
            await evaluar("location.hash = 'devoluciones'");
            await esperar("document.getElementById('tipo-operacion').value === 'DEVOLUCION'");
            await evaluar("document.getElementById('codigo-equipo').value = 'PRE-1'; document.getElementById('form-prestamo').requestSubmit()");
            await esperar("document.getElementById('equipos-prestados').textContent === '0' && !document.getElementById('actualizar-datos').disabled");
            assert.equal(escenarioJava.escrituras.length, 2);
            escenarioJava.desconectar();
            await evaluar("document.getElementById('actualizar-datos').click()");
            await esperar("document.getElementById('estado-conexion').textContent.includes('No se pudo conectar') && !document.getElementById('actualizar-datos').disabled");
            assert.equal(await evaluar("document.getElementById('total-equipos').textContent"), '5', 'No debe sustituirse el inventario por las 24 entradas del mock');
            assert.equal(await evaluar("document.querySelector('#form-prestamo button').disabled"), true);
            assert.deepEqual(errores, []);
            console.log('OK: modo real contra servidor HTTP DE PRUEBA con contrato Java; inventario, recomendación, préstamo, devolución, fallo aislado del historial y desconexión sin fallback.');
            console.log('Este resultado NO acredita una ejecución del backend Java.');
            return;
        }
        assert.equal(await evaluar('window.TecnoTrackConfig.modo'), 'simulado');
        assert.equal(await evaluar("document.querySelectorAll('#cuerpoInventario tr').length"), 8);
        assert.equal(await evaluar("document.querySelectorAll('#cuerpoInventario .tipo-equipo svg').length"), 8);
        assert.equal(await evaluar("typeof window.TecnoTrackInventario.actualizar"), 'function');
        await evaluar("window.__solicitudesInventario = 0; document.addEventListener('tecnotrack:solicitar-prestamo', () => window.__solicitudesInventario++); document.querySelector('#cuerpoInventario .boton-prestar').click()");
        await esperar("location.hash === '#prestamos' && document.getElementById('codigo-equipo').value === 'PC-APO-001'");
        assert.equal(await evaluar('window.__solicitudesInventario'), 1);
        assert.equal(await evaluar("document.getElementById('equipos-prestados').textContent"), '4');
        await evaluar("location.hash = 'inventario'");
        await esperar("!document.getElementById('inventario').hidden");
        await capturar('inventario-escritorio');
        await evaluar("document.getElementById('filtroTipo').value = 'Monitor'; document.getElementById('filtroTipo').dispatchEvent(new Event('change'))");
        assert.equal(await evaluar("document.querySelectorAll('#cuerpoInventario tr').length"), 4);
        await evaluar("document.getElementById('filtroUbicacion').value = 'Sputnik'; document.getElementById('filtroUbicacion').dispatchEvent(new Event('change'))");
        assert.equal(await evaluar("document.querySelectorAll('#cuerpoInventario tr').length"), 1);
        await evaluar("document.getElementById('filtroEstado').value = 'DISPONIBLE'; document.getElementById('filtroEstado').dispatchEvent(new Event('change'))");
        assert.equal(await evaluar("document.getElementById('mensajeSinResultados').hidden"), false);
        await evaluar("document.getElementById('limpiarFiltros').click()");
        await evaluar("document.getElementById('pagina-siguiente').click()");
        assert.match(await evaluar("document.getElementById('pagina-inventario').textContent"), /9–16/);
        await evaluar("document.getElementById('buscarEquipo').value = 'pc-apo-003'; document.getElementById('buscarEquipo').dispatchEvent(new Event('input'))");
        assert.equal(await evaluar("document.querySelectorAll('#cuerpoInventario tr').length"), 1);
        await evaluar("document.querySelector('#cuerpoInventario button').click()");
        await esperar("document.querySelectorAll('.alternativa-card').length === 5");
        assert.equal(await evaluar("document.querySelector('.alternativa-prioridad').textContent"), 'Primera opción de prueba');
        await capturar('alternativas-escritorio');
        await evaluar("document.querySelector('.alternativa-card button').click()");
        await esperar("location.hash === '#prestamos' && !document.getElementById('prestamos').hidden");
        assert.equal(await evaluar("document.getElementById('codigo-equipo').value"), 'PC-APO-001');
        assert.equal(await evaluar("document.getElementById('equipos-prestados').textContent"), '4');
        assert.equal(await evaluar("document.getElementById('form-prestamo').checkValidity()"), false);
        assert.equal(await evaluar("Array.from(document.getElementById('codigo-equipo').options).find(item => item.value === 'PC-APO-003').disabled"), true);
        assert.equal(await evaluar("Array.from(document.getElementById('codigo-equipo').options).find(item => item.value === 'PC-COR-001').disabled"), true);
        await capturar('prestamo-escritorio');
        await evaluar("window.confirm = () => false; document.getElementById('nombre-responsable').value = 'Prueba de interfaz'; document.getElementById('documento-usuario').value = '123'; document.getElementById('form-prestamo').requestSubmit()");
        assert.equal(await evaluar("document.getElementById('equipos-prestados').textContent"), '4');
        await evaluar("window.confirm = () => true; document.getElementById('form-prestamo').requestSubmit(); document.getElementById('form-prestamo').dispatchEvent(new Event('submit', {cancelable: true}))");
        await esperar("document.getElementById('equipos-prestados').textContent === '5' && !document.getElementById('actualizar-datos').disabled");
        await evaluar("document.getElementById('buscarEquipo').value = 'PC-APO-001'; document.getElementById('buscarEquipo').dispatchEvent(new Event('input'))");
        assert.equal(await evaluar("document.querySelector('#cuerpoInventario .estado-equipo').textContent"), 'Prestado');
        await evaluar("location.hash = 'devoluciones'");
        await esperar("document.getElementById('tipo-operacion').value === 'DEVOLUCION'");
        await evaluar("const opcion = Array.from(document.getElementById('codigo-equipo').options).find(item => item.text.includes('PC-APO-001')); document.getElementById('codigo-equipo').value = opcion.value; document.getElementById('form-prestamo').requestSubmit()");
        await esperar("document.getElementById('equipos-prestados').textContent === '4' && !document.getElementById('actualizar-datos').disabled");
        assert.equal(await evaluar("document.querySelector('#cuerpoInventario .estado-equipo').textContent"), 'Disponible');
        assert.equal(await evaluar("Array.from(document.getElementById('codigo-equipo').options).some(item => item.text.includes('PC-APO-001'))"), false);
        assert.equal(await evaluar("document.querySelectorAll('#tabla-historial-body tr').length"), 7);
        await evaluar("location.hash = 'historial'");
        await esperar("!document.getElementById('historial').hidden");
        await evaluar('history.back()');
        await esperar("location.hash === '#devoluciones' && document.getElementById('tipo-operacion').value === 'DEVOLUCION'");
        await evaluar('history.forward()');
        await esperar("location.hash === '#historial' && !document.getElementById('historial').hidden");
        await enviar('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
        await evaluar("location.hash = 'inventario'; document.getElementById('limpiarFiltros').click()");
        await esperar("!document.getElementById('inventario').hidden");
        assert.equal(await evaluar('document.documentElement.scrollWidth <= window.innerWidth'), true, 'Sin desbordamiento horizontal global en móvil');
        await capturar('inventario-movil');
        await evaluar("document.getElementById('buscarEquipo').value = 'PC-APO-003'; document.getElementById('buscarEquipo').dispatchEvent(new Event('input')); document.querySelector('#cuerpoInventario button').click()");
        await esperar("document.querySelectorAll('.alternativa-card').length === 5");
        assert.equal(await evaluar('document.documentElement.scrollWidth <= window.innerWidth'), true);
        await capturar('alternativas-movil');
        await evaluar('window.__paginaAnteriorDePrueba = true');
        await enviar('Page.navigate', { url: `http://127.0.0.1:${servidor.address().port}/?prueba=enlace-directo#devoluciones` });
        await esperar("!window.__paginaAnteriorDePrueba && document.getElementById('total-equipos')?.textContent === '24' && document.getElementById('tipo-operacion')?.value === 'DEVOLUCION'");
        assert.equal(await evaluar("location.search === '?prueba=enlace-directo'"), true);
        assert.equal(await evaluar("document.getElementById('prestamos').hidden"), false);
        assert.equal(await evaluar("document.querySelector('.navbar [aria-current=page]').hash"), '#devoluciones');
        assert.equal(await evaluar("Array.from(document.getElementById('codigo-equipo').options).filter(item => item.value).length"), 4);
        await capturar('devolucion-movil');
        assert.deepEqual(errores, [], 'No debe haber excepciones JavaScript en navegador');
        console.log('OK: inventario, SVG, paginación, filtros, cinco alternativas, precarga sin envío, préstamo, devolución, historial y Atrás/Adelante.');
        console.log('OK: vistas de escritorio 1536×1024 y móvil 390×844, sin desbordamiento global.');
        console.log('Capturas: ' + temporal);
    } finally {
        if (socket) socket.close();
        navegador.kill();
        servidor.closeAllConnections();
        await new Promise(resolve => servidor.close(resolve));
    }
}

verificarInterfaz().catch(error => { console.error(error); process.exitCode = 1; });

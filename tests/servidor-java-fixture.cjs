/* Respuestas controladas para probar el contrato HTTP, NO es el backend Java.
 * Los equipos corresponden a DatosIniciales.java. No hay IA ni recomendador aquí.
 */
const assert = require('node:assert/strict');

/** Prepara un guion de respuestas HTTP y fallos para la prueba del navegador.
 * @returns {Object} Handler y controles exclusivos del entorno de pruebas.
 */
function crearEscenarioJava() {
    let fase = 0;
    let desconectado = false;
    const escrituras = [];
    const equiposIniciales = [
        { id: 'PC-APO-001', tipo: 'COMPUTADOR_ESCRITORIO', marca: 'Compumax', sistemaOperativo: 'Ubuntu Linux', ubicacion: 'Apolo', estado: 'DISPONIBLE', prestable: true },
        { id: 'MOU-APO-001', tipo: 'MOUSE', marca: 'Compumax', sistemaOperativo: '', ubicacion: 'Apolo', estado: 'DISPONIBLE', prestable: true },
        { id: 'TEC-SPU-001', tipo: 'TECLADO', marca: 'Compumax', sistemaOperativo: '', ubicacion: 'Sputnik', estado: 'DISPONIBLE', prestable: true },
        { id: 'MON-ART-001', tipo: 'MONITOR', marca: 'Compumax', sistemaOperativo: '', ubicacion: 'Artemis', estado: 'DISPONIBLE', prestable: true },
        { id: 'PC-HOU-001', tipo: 'COMPUTADOR_ESCRITORIO', marca: 'Compumax', sistemaOperativo: 'Ubuntu Linux', ubicacion: 'Houston', estado: 'INHABILITADO', prestable: false }
    ];
    const equipos = () => equiposIniciales.map(equipo => equipo.id === 'PC-APO-001' && fase === 1 ? { ...equipo, estado: 'PRESTADO' } : { ...equipo });
    const prestamo = () => ({ id: 'PRE-1', equipoId: 'PC-APO-001', responsable: 'Prueba de contrato', fechaPrestamo: '2026-10-16T10:00:00', fechaDevolucion: fase === 2 ? '2026-10-16T11:00:00' : null, estado: fase === 2 ? 'DEVUELTO' : 'ACTIVO' });
    const responder = (res, status, datos) => { res.writeHead(status, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(datos)); };
    return {
        desconectar: () => { desconectado = true; },
        escrituras,
        manejar(req, res) {
            const url = new URL(req.url, 'http://localhost');
            if (!url.pathname.startsWith('/api/')) return false;
            if (desconectado) { req.socket.destroy(); return true; }
            if (req.method === 'GET') {
                if (url.pathname === '/api/equipos') responder(res, 200, equipos());
                else if (url.pathname === '/api/prestamos') responder(res, 200, fase ? [prestamo()] : []);
                else if (url.pathname === '/api/movimientos') {
                    // Fallo deliberado de la prueba: comprueba el aislamiento del historial.
                    responder(res, fase ? 500 : 200, fase ? { error: 'Fallo de historial del escenario de prueba' } : []);
                } else if (url.pathname === '/api/recomendaciones') {
                    responder(res, 200, url.searchParams.get('equipoId') === 'PC-HOU-001' && fase !== 1 ? [equipos()[0]] : []);
                } else responder(res, 404, { error: 'Ruta de prueba desconocida' });
                return true;
            }
            if (req.method === 'POST') {
                let cuerpo = '';
                req.on('data', datos => { cuerpo += datos; });
                req.on('end', () => {
                    try {
                        const datos = JSON.parse(cuerpo);
                        escrituras.push({ ruta: url.pathname, datos });
                        if (url.pathname === '/api/prestamos') {
                            assert.deepEqual(datos, { equipoId: 'PC-APO-001', responsable: 'Prueba de contrato' });
                            fase = 1;
                            responder(res, 201, { mensaje: 'Préstamo registrado', prestamo: prestamo() });
                        } else if (url.pathname === '/api/devoluciones') {
                            assert.deepEqual(datos, { equipoId: 'PC-APO-001' });
                            fase = 2;
                            responder(res, 200, { mensaje: 'Devolución registrada', prestamo: prestamo() });
                        } else responder(res, 404, { error: 'Ruta de prueba desconocida' });
                    } catch { responder(res, 400, { error: 'Solicitud distinta del contrato esperado en la prueba' }); }
                });
                return true;
            }
            responder(res, 405, { error: 'Método no permitido' });
            return true;
        }
    };
}

module.exports = { crearEscenarioJava };

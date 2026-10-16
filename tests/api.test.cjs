const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.join(__dirname, '..', 'fronted');

function entorno(fetch) {
    const contexto = vm.createContext({ window: {}, fetch, URL, AbortController, setTimeout, clearTimeout });
    for (const archivo of ['js/datos.js', 'js/api.js', 'js/api-mock.js']) {
        vm.runInContext(fs.readFileSync(path.join(root, archivo), 'utf8'), contexto);
    }
    return contexto;
}
function real(fetch, extra = {}) {
    const contexto = entorno(fetch);
    return contexto.window.TecnoTrackAPI.crearAPI({ modo: 'real', baseUrl: 'https://backend.example/api/',
        endpoints: { equipos: 'equipos', prestamos: 'prestamos', historial: 'movimientos', registrarPrestamo: 'prestamos', devolverPrestamo: 'devoluciones', recomendaciones: id => `recomendaciones?equipoId=${encodeURIComponent(id)}` }, ...extra });
}

test('simulación: préstamo, devolución, historial y copia independiente', async () => {
    const contexto = entorno(() => { throw Error('El mock no debe usar fetch'); });
    const api = vm.runInContext('window.TecnoTrackAPI.crearAPI({modo:"simulado"}, window.TecnoTrackMock.crearAdaptador({equipos,prestamos,movimientos}))', contexto);
    const equipos = await api.obtenerEquipos();
    assert.equal(equipos.length, 24);
    equipos[0].estado = 'ALTERADO';
    assert.equal((await api.obtenerEquipos())[0].estado, 'DISPONIBLE');
    const prestamo = await api.registrarPrestamo({ equipoId: 'PC-SPU-001', responsable: '<script>prueba</script>', identificacion: '123' });
    assert.equal((await api.obtenerEquipos()).find(e => e.id === 'PC-SPU-001').estado, 'PRESTADO');
    await assert.rejects(api.registrarPrestamo({ equipoId: 'PC-SPU-001', responsable: 'Otra', identificacion: '456' }), { codigo: 'SIMULACION' });
    const alternativas = await api.obtenerRecomendaciones('PC-APO-003');
    assert.equal(alternativas.length, 4);
    assert.equal(alternativas.some(item => item.equipoId === 'PC-SPU-001'), false);
    await api.devolverPrestamo(prestamo.id);
    assert.equal((await api.obtenerEquipos()).find(e => e.id === 'PC-SPU-001').estado, 'DISPONIBLE');
    assert.equal((await api.obtenerHistorial()).length, 7);
    await assert.rejects(api.devolverPrestamo(prestamo.id), { codigo: 'SIMULACION' });
    assert.equal(vm.runInContext('equipos.find(e => e.id === "PC-SPU-001").estado', contexto), 'DISPONIBLE');
});

test('fixture de alternativas: conserva orden, pasa de cinco a cero y recupera equipos devueltos', async () => {
    const contexto = entorno(() => { throw Error('No debe conectar con el backend'); });
    const api = vm.runInContext('window.TecnoTrackAPI.crearAPI({modo:"simulado"}, window.TecnoTrackMock.crearAdaptador({equipos,prestamos,movimientos}))', contexto);
    const esperados = ['PC-APO-001', 'PC-SPU-001', 'PC-SPU-002', 'PC-ART-001', 'PC-HOU-001'];
    const iniciales = await api.obtenerEquipos();
    const prestamosCreados = [];
    for (let indice = 0; indice <= esperados.length; indice++) {
        const lista = await api.obtenerRecomendaciones('PC-APO-003');
        assert.deepEqual(Array.from(lista, item => item.equipoId), esperados.slice(indice));
        lista.forEach(item => assert.ok(iniciales.some(equipo => equipo.id === item.equipoId && equipo.estado === 'DISPONIBLE' && equipo.prestable === true)));
        if (indice < esperados.length) prestamosCreados.push(await api.registrarPrestamo({ equipoId: esperados[indice], responsable: 'Prueba', identificacion: '123' }));
    }
    await api.devolverPrestamo(prestamosCreados[0].id);
    assert.deepEqual(Array.from(await api.obtenerRecomendaciones('PC-APO-003'), item => item.equipoId), ['PC-APO-001']);
    assert.equal((await api.obtenerRecomendaciones('MON-SPU-001')).length, 0);
});

test('transporte Java: URL, método, cuerpo, confirmación y devolución por equipo', async () => {
    const llamadas = [];
    const prestamo = { id: 'PRE-1', equipoId: 'PC-APO-001', responsable: 'Prueba', fechaPrestamo: '2026-10-16T10:00:00', fechaDevolucion: null, estado: 'ACTIVO' };
    const api = real(async (url, opciones) => {
        llamadas.push([String(url), opciones]);
        if (String(url).includes('recomendaciones')) return new Response('[]');
        return new Response(JSON.stringify({ mensaje: 'Operación registrada', prestamo }), { status: 201 });
    });
    assert.equal((await api.registrarPrestamo({ equipoId: 'PC-APO-001', responsable: 'Prueba', identificacion: 'NO-ENVIAR' })).id, 'PRE-1');
    assert.equal(llamadas[0][0], 'https://backend.example/api/prestamos');
    assert.equal(llamadas[0][1].method, 'POST');
    assert.deepEqual(JSON.parse(llamadas[0][1].body), { equipoId: 'PC-APO-001', responsable: 'Prueba' });
    await api.devolverPrestamo('PRE-1', { equipoId: 'PC-APO-001' });
    assert.equal(llamadas[1][0], 'https://backend.example/api/devoluciones');
    assert.deepEqual(JSON.parse(llamadas[1][1].body), { equipoId: 'PC-APO-001' });
    await api.obtenerRecomendaciones('a/b');
    assert.match(llamadas[2][0], /equipoId=a%2Fb/);
    await assert.rejects(api.devolverPrestamo('PRE-1'), { codigo: 'VALIDACION' });
    assert.equal(llamadas.length, 3);
});

test('normalización Java: enums, documento ausente, historial y recomendaciones sin motivos', async () => {
    const equipo = { id: 'PC-APO-001', tipo: 'COMPUTADOR_ESCRITORIO', marca: 'Compumax', sistemaOperativo: 'Ubuntu Linux', ubicacion: 'Apolo', estado: 'DANADO', prestable: true };
    const prestamo = { id: 'PRE-1', equipoId: equipo.id, responsable: 'Prueba', fechaPrestamo: '2026-10-16T10:00:00', fechaDevolucion: null, estado: 'ACTIVO' };
    const movimiento = { id: 'MOV-1', equipoId: equipo.id, responsable: 'Prueba', tipo: 'PRESTAMO', fecha: '2026-10-16T10:00:00', observacion: 'Préstamo registrado: PRE-1' };
    const respuestas = { equipos: [equipo], prestamos: [prestamo], movimientos: [movimiento], recomendaciones: [equipo] };
    const api = real(async url => new Response(JSON.stringify(respuestas[new URL(url).pathname.split('/').at(-1)])));
    const normalizado = (await api.obtenerEquipos())[0];
    assert.equal(normalizado.tipo, 'Computador');
    assert.equal(normalizado.estado, 'DAÑADO');
    assert.equal(equipo.estado, 'DANADO');
    assert.equal((await api.obtenerPrestamos())[0].identificacion, undefined);
    assert.equal((await api.obtenerHistorial())[0].observacion, movimiento.observacion);
    const alternativa = (await api.obtenerRecomendaciones('PC-HOU-001'))[0];
    assert.equal(alternativa.equipoId, equipo.id);
    assert.equal(alternativa.motivo, null);
    assert.equal(alternativa.equipo.tipo, 'Computador');
});

test('escritura Java: rechaza confirmaciones incompletas y errores HTTP mantienen detalle', async () => {
    for (const cuerpo of ['{}', '{"mensaje":"ok"}', '[]']) {
        await assert.rejects(real(async () => new Response(cuerpo)).registrarPrestamo({ equipoId: 'PC-APO-001', responsable: 'Prueba' }), { codigo: 'RESPUESTA_INVALIDA' });
    }
    await assert.rejects(real(async () => new Response(null, { status: 204 })).registrarPrestamo({ equipoId: 'PC-APO-001', responsable: 'Prueba' }), { codigo: 'RESPUESTA_INVALIDA' });
    await assert.rejects(real(async () => new Response(JSON.stringify({error: 'El equipo no esta disponible para prestamo'}), {status: 400})).obtenerEquipos(), error => error.codigo === 'HTTP' && error.message.includes('El equipo no esta disponible'));
});

test('consulta vacía válida y errores de contrato', async () => {
    assert.equal((await real(async () => new Response('[]')).obtenerEquipos()).length, 0);
    for (const cuerpo of ['no-json', '{}', '[{"id":"incompleto"}]']) {
        await assert.rejects(real(async () => new Response(cuerpo)).obtenerEquipos(), { codigo: 'RESPUESTA_INVALIDA' });
    }
    await assert.rejects(real(async () => new Response(null, { status: 204 })).obtenerEquipos(), { codigo: 'RESPUESTA_INVALIDA' });
});

test('HTTP, conexión, timeout y configuración sin fallback', async () => {
    await assert.rejects(real(async () => new Response('{}', { status: 409 })).obtenerEquipos(), { codigo: 'HTTP', status: 409 });
    await assert.rejects(real(async () => { throw new TypeError('offline'); }).obtenerEquipos(), { codigo: 'CONEXION' });
    await assert.rejects(real((url, { signal }) => new Promise((resolve, reject) => {
        signal.addEventListener('abort', () => reject(Object.assign(new Error('timeout'), { name: 'AbortError' })));
    }), { timeoutMs: 5 }).obtenerEquipos(), { codigo: 'TIEMPO_AGOTADO' });
    await assert.rejects(real(() => { throw Error('No debe llamar fetch'); }, { endpoints: {} }).obtenerEquipos(), { codigo: 'CONFIGURACION' });
});

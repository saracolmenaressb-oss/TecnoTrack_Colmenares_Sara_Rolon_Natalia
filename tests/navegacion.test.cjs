const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

test('navegación: una vista visible, enlace activo, enlaces directos y ruta desconocida', () => {
    const ids = ['dashboard', 'inventario', 'prestamos', 'historial', 'recomendaciones'];
    const secciones = ids.map(id => ({ id, hidden: false }));
    const enlaces = [...ids, 'devoluciones'].map(id => ({ hash: '#' + id, atributos: {}, activo: false,
        classList: { toggle(nombre, valor) { enlaces.find(enlace => enlace.classList === this).activo = valor; } },
        setAttribute(nombre, valor) { this.atributos[nombre] = valor; },
        removeAttribute(nombre) { delete this.atributos[nombre]; }
    }));
    const nodos = { 'titulo-pagina': {}, 'descripcion-pagina': {}, contenido: { focus() {} } };
    const location = { hash: '#inventario' };
    const eventos = {};
    const document = {
        getElementById: id => nodos[id],
        querySelectorAll: selector => selector === 'main > .section' ? secciones : enlaces
    };
    const notificaciones = [];
    const contexto = vm.createContext({ document, location,
        CustomEvent: class { constructor(type, options) { this.type = type; this.detail = options.detail; } },
        history: { replaceState(a, b, hash) { location.hash = hash; } },
        window: { addEventListener(nombre, fn) { eventos[nombre] = fn; }, dispatchEvent(evento) { notificaciones.push(evento.detail.pagina); }, scrollTo() {} }
    });
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../fronted/js/navegacion.js'), 'utf8'), contexto);
    for (const id of ['inventario', 'prestamos', 'devoluciones', 'prestamos', 'devoluciones', 'historial', 'recomendaciones', 'dashboard', 'inventario']) {
        location.hash = '#' + id;
        eventos.hashchange();
        assert.deepEqual(secciones.filter(seccion => !seccion.hidden).map(seccion => seccion.id), [id === 'devoluciones' ? 'prestamos' : id]);
        assert.equal(notificaciones.at(-1), id);
        assert.equal(enlaces.filter(enlace => enlace.activo).length, 1);
        assert.equal(enlaces.find(enlace => enlace.hash === '#' + id).atributos['aria-current'], 'page');
        assert.match(document.title, /TecnoTrack/);
    }
    location.hash = '#ruta-desconocida';
    eventos.hashchange();
    assert.equal(location.hash, '#dashboard');
    assert.equal(secciones.filter(seccion => !seccion.hidden)[0].id, 'dashboard');
});

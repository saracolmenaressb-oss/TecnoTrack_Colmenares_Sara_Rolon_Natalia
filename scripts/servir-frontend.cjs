/* Servidor estático local, sin dependencias. Ejecutar: node scripts/servir-frontend.cjs */
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');

const raizProyecto = path.resolve(__dirname, '..');
const raizFrontend = path.join(raizProyecto, 'fronted');
const tipos = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png' };

// Solo se sirve la entrada y fronted/: nunca el backend, .git ni archivos de configuración ajenos.
const servidor = http.createServer((peticion, respuesta) => {
    try {
        const ruta = decodeURIComponent(new URL(peticion.url, 'http://localhost').pathname);
        const relativa = ruta === '/' ? '/index.html' : ruta.endsWith('/') ? ruta + 'index.html' : ruta;
        const archivo = path.resolve(raizProyecto, '.' + relativa);
        const permitido = archivo === path.join(raizProyecto, 'index.html') || archivo.startsWith(raizFrontend + path.sep);
        if (!permitido || !tipos[path.extname(archivo)] || !['GET', 'HEAD'].includes(peticion.method)) {
            respuesta.writeHead(404).end('Recurso no disponible');
            return;
        }
        fs.readFile(archivo, (error, contenido) => {
            respuesta.writeHead(error ? 404 : 200, { 'Content-Type': (tipos[path.extname(archivo)] || 'text/plain') + '; charset=utf-8' });
            respuesta.end(error || peticion.method === 'HEAD' ? '' : contenido);
        });
    } catch { respuesta.writeHead(400).end('Ruta no válida'); }
});

servidor.on('error', error => {
    console.error(error.code === 'EADDRINUSE' ? 'El puerto 5500 está ocupado. Cierra el otro servidor local antes de volver a iniciar.' : error.message);
    process.exitCode = 1;
});
servidor.listen(5500, '127.0.0.1', () => console.log('TecnoTrack: http://127.0.0.1:5500 · Detener con Ctrl+C'));

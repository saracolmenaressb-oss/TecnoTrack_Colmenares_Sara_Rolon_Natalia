/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.mycompany.tecnotrack.Controlador;

import com.mycompany.tecnotrack.Modelo.Clases.Equipo;
import com.mycompany.tecnotrack.Modelo.Clases.Movimiento;
import com.mycompany.tecnotrack.Modelo.Clases.Prestamo;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 *
 * @author camper
 */
public class ServidorHTTP {
    
    private final TecnoTrackService servicio;
    private HttpServer servidor;

    public ServidorHTTP(TecnoTrackService servicio) {
        this.servicio = servicio;
    }
    
    public void iniciar() throws IOException{
        
        servidor = HttpServer.create(new InetSocketAddress(8081), 0);
        
        servidor.createContext("/api/equipos", this::manejarEquipos);
        servidor.createContext("/api/prestamos", this::manejarPrestamos);
        servidor.createContext("/api/devoluciones", this::manejarDevoluciones);
        servidor.createContext("/api/movimientos", this::manejarMovimientos);
        servidor.createContext("/api/recomendaciones", this::manejarRecomendaciones);
        
        servidor.start();
        
        System.out.println("TecnoTrack esta ejecutandose");
        System.out.println("Servidor: http://localhost:8081");
    }
    
    
    private void manejarEquipos(HttpExchange exchange) throws IOException{
        if(responderOpciones(exchange)){
            return;
        }
        
        if(!exchange.getRequestMethod().equalsIgnoreCase("GET")){
            responder(exchange, 405, error("Metodo no permitido"));
            return;
        }
    
        StringBuilder json = new StringBuilder("[");
        List<Equipo> equipos = servicio.listarEquipos();
        
        for (int i = 0; i < equipos.size(); i++) {
            if(i > 0){
                json.append(",");
            }
            json.append(equipoJson(equipos.get(i)));
        }
        
        json.append("]");
        responder(exchange, 200, json.toString());
    }
    
    private void manejarPrestamos(HttpExchange exchange) throws IOException{
        
        if(responderOpciones(exchange)){
            return;
        }
        
        if(exchange.getRequestMethod().equalsIgnoreCase("GET")){
            StringBuilder json = new StringBuilder("[");
            List<Prestamo> prestamos = servicio.listarPrestamos();
            
            for (int i = 0; i < prestamos.size(); i++) {
                if(i > 0){
                    json.append(",");
                }
                json.append(prestamoJson(prestamos.get(i)));
            }
            
            json.append("]");
            responder(exchange, 200, json.toString());
            return;            
        }
        
        if(!exchange.getRequestMethod().equalsIgnoreCase("POST")){
            responder(exchange, 405, error("Metodo no permitido"));
            return;
        }
        
        try {
            String cuerpo = leerCuerpo(exchange);
            String equipoId = obtenerCampo(cuerpo, "equipoId");
            String responsable = obtenerCampo(cuerpo, "responsable");

            Prestamo prestamo =
                    servicio.prestarEquipo(equipoId, responsable);

            responder(exchange, 201,
                    "{\"mensaje\":\"Préstamo registrado\","
                    + "\"prestamo\":" + prestamoJson(prestamo) + "}");

        } catch (IllegalArgumentException ex) {
            responder(exchange, 400, error(ex.getMessage()));
        }
    }

    private void manejarDevoluciones(HttpExchange exchange)
            throws IOException {

        if (responderOpciones(exchange)) {
            return;
        }

        if (!exchange.getRequestMethod().equalsIgnoreCase("POST")) {
            responder(exchange, 405, error("Método no permitido."));
            return;
        }

        try {
            String cuerpo = leerCuerpo(exchange);
            String equipoId = obtenerCampo(cuerpo, "equipoId");
            String observacion = obtenerCampo(cuerpo, "observacion");

            Prestamo prestamo =
                    servicio.devolverEquipo(equipoId, observacion);

            responder(exchange, 200,
                    "{\"mensaje\":\"Devolución registrada\","
                    + "\"prestamo\":" + prestamoJson(prestamo) + "}");

        } catch (IllegalArgumentException ex) {
            responder(exchange, 400, error(ex.getMessage()));
        }
    }

    private void manejarMovimientos(HttpExchange exchange)
            throws IOException {

        if (responderOpciones(exchange)) {
            return;
        }

        if (!exchange.getRequestMethod().equalsIgnoreCase("GET")) {
            responder(exchange, 405, error("Método no permitido."));
            return;
        }

        StringBuilder json = new StringBuilder("[");
        List<Movimiento> movimientos = servicio.listarMovimientos();

        for (int i = 0; i < movimientos.size(); i++) {
            if (i > 0) {
                json.append(",");
            }
            json.append(movimientoJson(movimientos.get(i)));
        }

        json.append("]");
        responder(exchange, 200, json.toString());
    }

    private void manejarRecomendaciones(HttpExchange exchange)
            throws IOException {

        if (responderOpciones(exchange)) {
            return;
        }

        if (!exchange.getRequestMethod().equalsIgnoreCase("GET")) {
            responder(exchange, 405, error("Método no permitido."));
            return;
        }

        try {
            String query = exchange.getRequestURI().getRawQuery();

            if (query == null || !query.startsWith("equipoId=")) {
                responder(exchange, 400,
                        error("Falta el parámetro equipoId."));
                return;
            }

            String equipoId = URLDecoder.decode(
                    query.substring("equipoId=".length()),
                    StandardCharsets.UTF_8.name());

            List<Equipo> alternativas =
                    servicio.recomendarAlternativas(equipoId);

            StringBuilder json = new StringBuilder("[");

            for (int i = 0; i < alternativas.size(); i++) {
                if (i > 0) {
                    json.append(",");
                }
                json.append(equipoJson(alternativas.get(i)));
            }

            json.append("]");
            responder(exchange, 200, json.toString());

        } catch (IllegalArgumentException ex) {
            responder(exchange, 400, error(ex.getMessage()));
        }
    }

    private String leerCuerpo(HttpExchange exchange) throws IOException {
        try (InputStream input = exchange.getRequestBody()) {
            return new String(
                    input.readAllBytes(), StandardCharsets.UTF_8);
        }
    }

    private String obtenerCampo(String json, String campo) {
        Pattern patron = Pattern.compile(
                "\"" + Pattern.quote(campo)
                + "\"\\s*:\\s*\"((?:\\\\.|[^\"\\\\])*)\"");

        Matcher matcher = patron.matcher(json);

        if (!matcher.find()) {
            return null;
        }

        return matcher.group(1)
                .replace("\\\"", "\"")
                .replace("\\\\", "\\")
                .replace("\\n", "\n")
                .replace("\\r", "\r");
    }

    private String equipoJson(Equipo e) {
        return "{"
                + "\"id\":" + comillas(e.getId()) + ","
                + "\"tipo\":" + comillas(e.getTipo().name()) + ","
                + "\"marca\":" + comillas(e.getMarca()) + ","
                + "\"sistemaOperativo\":"
                + comillas(e.getSistemaOperativo()) + ","
                + "\"ubicacion\":" + comillas(e.getUbicacion()) + ","
                + "\"estado\":" + comillas(e.getEstado().name()) + ","
                + "\"prestable\":" + e.isPrestable()
                + "}";
    }

    private String prestamoJson(Prestamo p) {
        return "{"
                + "\"id\":" + comillas(p.getId()) + ","
                + "\"equipoId\":" + comillas(p.getEquipoId()) + ","
                + "\"responsable\":" + comillas(p.getResponsable()) + ","
                + "\"fechaPrestamo\":"
                + comillas(p.getFechaPrestamo().toString()) + ","
                + "\"fechaDevolucion\":"
                + (p.getFechaDevolucion() == null
                    ? "null"
                    : comillas(p.getFechaDevolucion().toString())) + ","
                + "\"estado\":" + comillas(p.getEstado().name())
                + "}";
    }

    private String movimientoJson(Movimiento m) {
        return "{"
                + "\"id\":" + comillas(m.getId()) + ","
                + "\"tipo\":" + comillas(m.getTipo().name()) + ","
                + "\"equipoId\":" + comillas(m.getEquipoId()) + ","
                + "\"responsable\":" + comillas(m.getResponsable()) + ","
                + "\"fecha\":" + comillas(m.getFecha().toString()) + ","
                + "\"observacion\":" + comillas(m.getObservacion())
                + "}";
    }

    private String comillas(String valor) {
        if (valor == null) {
            return "null";
        }

        return "\""
                + valor.replace("\\", "\\\\")
                       .replace("\"", "\\\"")
                       .replace("\n", "\\n")
                       .replace("\r", "\\r")
                       .replace("\t", "\\t")
                + "\"";
    }

    private String error(String mensaje) {
        return "{\"error\":" + comillas(mensaje) + "}";
    }

    private boolean responderOpciones(HttpExchange exchange)
            throws IOException {

        agregarCabeceras(exchange);

        if (exchange.getRequestMethod().equalsIgnoreCase("OPTIONS")) {
            exchange.sendResponseHeaders(204, -1);
            exchange.close();
            return true;
        }

        return false;
    }

    private void responder(
            HttpExchange exchange, int codigo, String respuesta)
            throws IOException {

        agregarCabeceras(exchange);

        exchange.getResponseHeaders().set(
                "Content-Type", "application/json; charset=UTF-8");

        byte[] bytes = respuesta.getBytes(StandardCharsets.UTF_8);

        exchange.sendResponseHeaders(codigo, bytes.length);

        try (OutputStream output = exchange.getResponseBody()) {
            output.write(bytes);
        }
    }

    private void agregarCabeceras(HttpExchange exchange) {
        exchange.getResponseHeaders().set(
                "Access-Control-Allow-Origin", "*");

        exchange.getResponseHeaders().set(
                "Access-Control-Allow-Methods", "GET, POST, OPTIONS");

        exchange.getResponseHeaders().set(
                "Access-Control-Allow-Headers", "Content-Type");
    }
}
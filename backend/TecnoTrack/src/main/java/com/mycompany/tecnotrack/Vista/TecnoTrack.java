/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 */

package com.mycompany.tecnotrack.Vista;

import com.mycompany.tecnotrack.Controlador.ServidorHTTP;
import com.mycompany.tecnotrack.Controlador.TecnoTrackService;
import com.mycompany.tecnotrack.Modelo.Persistencia.DatosIniciales;
import java.io.IOException;

/**
 *
 * @author camper
 */
public class TecnoTrack {

    public static void main(String[] args) {
        
        try{
            TecnoTrackService servicio = new TecnoTrackService();
            
            DatosIniciales.cargar(servicio);
            
            ServidorHTTP servidor = new ServidorHTTP(servicio);
            
            servidor.iniciar();
            
            
        } catch(IOException e){
            System.out.println("No se pudo iniciar el servidor: " + e.getMessage());
            
        } catch(Exception e){
            System.out.println("Error al iniciar el TecnoTrack: " + e.getMessage());
            e.printStackTrace();
        }
        
        
        
        
        
    }
}

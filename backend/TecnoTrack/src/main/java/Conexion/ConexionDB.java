/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package Conexion;

import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.DriverManager;
import java.sql.SQLException;

/**
 *
 * @author camper
 */
public class ConexionDB {
    private static String url = "";
    private static String user = "";
    private static String password = System.getenv("TECNOTRACK_DB_PASSWORD");
    public static Connection con = null;
    
    public static Connection MysConnection() throws SQLException{
        url = "jdbc:mysql://localhost:3306/TecnoTrack";
        user = "root";
        password = System.getenv("TECNOTRACK_DB_PASSWORD");  
        return getConnection(url, user, password);
    }
     private static Connection getConnection(String url, String user,String password){
        try {
            con = DriverManager.getConnection(url, user, password);
            if(con!=null){
                DatabaseMetaData meta = con.getMetaData();
                System.out.println("Base de datos conectada "+ meta.getDriverName());
            }
        } catch (Exception ex) {
            System.out.println(ex.getMessage());
        }
        return con;
    }
}

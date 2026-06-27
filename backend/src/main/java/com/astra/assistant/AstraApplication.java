package com.astra.assistant;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class AstraApplication {
    public static void main(String[] args) {
        SpringApplication.run(AstraApplication.class, args);
        System.out.println("\n=======================================================");
        System.out.println(" ASTRA AI Assistant backend started successfully!");
        System.out.println(" App URL: http://localhost:8080");
        System.out.println(" Binds strictly to: 127.0.0.1 (Local laptop only)");
        System.out.println("=======================================================\n");
    }
}

package com.room911.access_control.controller;

import java.util.Map;
import java.util.Optional;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.room911.access_control.model.Employee;
import com.room911.access_control.repository.EmployeeRepository;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    private final EmployeeRepository employeeRepository;

    public AuthController(EmployeeRepository employeeRepository) {
        this.employeeRepository = employeeRepository;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> credentials) {
        // Recibe 'username', 'internalId' o cualquier campo enviado
        String inputUser = credentials.get("username") != null 
                ? credentials.get("username") 
                : credentials.get("internalId");
        
        String password = credentials.get("password");

        if (inputUser == null || password == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Debe ingresar usuario y contraseña."));
        }

        // 1. Buscar primero por carnet / internalId
        Optional<Employee> empOpt = employeeRepository.findByInternalId(inputUser);

        // 2. Si no lo encuentra por carnet, buscar por primer nombre (Laura)
        if (empOpt.isEmpty()) {
            empOpt = employeeRepository.findAll().stream()
                    .filter(e -> e.getFirstName() != null && e.getFirstName().equalsIgnoreCase(inputUser))
                    .findFirst();
        }

        // 3. Validar la contraseña y el rol de Administración
        if (empOpt.isPresent()) {
            Employee emp = empOpt.get();
            
            boolean isAdmin = emp.getDepartment() != null 
                    && "Administración".equalsIgnoreCase(emp.getDepartment().getName());

            if (password.equals(emp.getPassword()) && isAdmin) {
                return ResponseEntity.ok(Map.of(
                    "status", "success",
                    "message", "Autenticación exitosa",
                    "token", "token_admin_room_911",
                    "user", emp.getFirstName() + " " + emp.getLastName()
                ));
            }
        }

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("message", "Credenciales inválidas. Acceso restringido a admin_room_911."));
    }
}
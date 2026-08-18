package com.room911.access_control.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.room911.access_control.model.Department;
import com.room911.access_control.model.Employee;
import com.room911.access_control.repository.DepartmentRepository; // 👈 Importar
import com.room911.access_control.repository.EmployeeRepository;

@RestController
@RequestMapping("/api/employees")
@CrossOrigin(origins = "*")
public class EmployeeController {

    private final EmployeeRepository employeeRepository;
    private final DepartmentRepository departmentRepository; // 👈 Inyectar

    public EmployeeController(EmployeeRepository employeeRepository, DepartmentRepository departmentRepository) {
        this.employeeRepository = employeeRepository;
        this.departmentRepository = departmentRepository;
    }

    // 1. Obtener todos los empleados
    @GetMapping
    public ResponseEntity<List<Employee>> getAllEmployees() {
        List<Employee> employees = employeeRepository.findAll();
        return ResponseEntity.ok(employees);
    }

    // 2. CREAR UN NUEVO EMPLEADO / ADMIN (Corregido)
    @PostMapping
    public ResponseEntity<?> createEmployee(@RequestBody Employee employee) {
        // Validar que venga departamento en el JSON
        if (employee.getDepartment() == null || employee.getDepartment().getId() == null) {
            return ResponseEntity.badRequest().body("Debe especificar un departamento válido con ID.");
        }

        // Buscar el departamento en PostgreSQL
        Optional<Department> deptOpt = departmentRepository.findById(employee.getDepartment().getId());

        if (deptOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("El departamento con ID " + employee.getDepartment().getId() + " no existe en la base de datos.");
        }

        // Vincular la entidad real gestionada por JPA
        employee.setDepartment(deptOpt.get());

        Employee savedEmployee = employeeRepository.save(employee);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedEmployee);
    }

    // 3. Validar carnet
    @GetMapping("/validate/{internalId}")
    public ResponseEntity<Map<String, Object>> validateCard(@PathVariable String internalId) {
        Map<String, Object> response = new HashMap<>();
        Optional<Employee> employeeOpt = employeeRepository.findByInternalId(internalId);

        if (employeeOpt.isEmpty()) {
            response.put("valid", false);
            response.put("message", "Carnet no registrado en el sistema.");
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        }

        Employee employee = employeeOpt.get();

        if (Boolean.TRUE.equals(employee.getAccessGranted())) {
            response.put("valid", true);
            response.put("message", "Acceso concedido.");
            response.put("employee", employee);
            return ResponseEntity.ok(response);
        } else {
            response.put("valid", false);
            response.put("message", "Acceso denegado: El empleado no tiene permisos de entrada.");
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
        }
    }

    // 4. Eliminar todos los empleados
    @DeleteMapping
    public ResponseEntity<String> deleteAllEmployees() {
        employeeRepository.deleteAll();
        return ResponseEntity.ok("🔥 Todos los empleados han sido eliminados correctamente.");
    }
}
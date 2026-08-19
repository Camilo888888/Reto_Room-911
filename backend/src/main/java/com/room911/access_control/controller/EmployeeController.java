package com.room911.access_control.controller;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
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
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.room911.access_control.model.Department;
import com.room911.access_control.model.Employee;
import com.room911.access_control.repository.DepartmentRepository;
import com.room911.access_control.repository.EmployeeRepository;

@RestController
@RequestMapping("/api/employees")
@CrossOrigin(origins = "*")
public class EmployeeController {

    private final EmployeeRepository employeeRepository;
    private final DepartmentRepository departmentRepository;

    public EmployeeController(EmployeeRepository employeeRepository, DepartmentRepository departmentRepository) {
        this.employeeRepository = employeeRepository;
        this.departmentRepository = departmentRepository;
    }

    @GetMapping
    public ResponseEntity<List<Employee>> getAllEmployees() {
        return ResponseEntity.ok(employeeRepository.findAll());
    }

    @PostMapping
    public ResponseEntity<?> createEmployee(@RequestBody Employee employee) {
        if (employee.getDepartment() == null || employee.getDepartment().getId() == null) {
            return ResponseEntity.badRequest().body("Debe especificar un departamento válido con ID.");
        }

        Optional<Department> deptOpt = departmentRepository.findById(employee.getDepartment().getId());
        if (deptOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("El departamento no existe.");
        }

        employee.setDepartment(deptOpt.get());
        if (employee.getAccessGranted() == null) employee.setAccessGranted(true);
        if (employee.getActive() == null) employee.setActive(true);

        return ResponseEntity.status(HttpStatus.CREATED).body(employeeRepository.save(employee));
    }

    // CARGA MASIVA CSV
    @PostMapping("/upload-csv")
    public ResponseEntity<?> uploadCSV(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body("El archivo está vacío.");
        }

        try (BufferedReader br = new BufferedReader(new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {
            String line;
            boolean firstLine = true;
            int agregados = 0;

            while ((line = br.readLine()) != null) {
                if (line.trim().isEmpty()) continue;

                if (firstLine) {
                    firstLine = false;
                    continue;
                }

                // Regex para separar por coma respetando valores entre comillas
                String[] data = line.split(",(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)", -1);

                if (data.length >= 7) {
                    String internalId = limpiarTexto(data[0]);
                    String firstName = limpiarTexto(data[1]);
                    String lastName = limpiarTexto(data[2]);
                    String deptName = limpiarTexto(data[3]);
                    boolean accessGranted = Boolean.parseBoolean(limpiarTexto(data[4]));
                    boolean active = Boolean.parseBoolean(limpiarTexto(data[5]));
                    String password = limpiarTexto(data[6]);

                    if (deptName.isEmpty()) continue;

                    // 1. Si el departamento no existe en BD, lo crea automáticamente
                    Department dept = departmentRepository.findByName(deptName)
                        .orElseGet(() -> {
                            Department nuevoDept = new Department();
                            nuevoDept.setName(deptName);
                            return departmentRepository.save(nuevoDept);
                        });

                    // 2. Registra o actualiza el empleado
                    Employee emp = employeeRepository.findByInternalId(internalId).orElse(new Employee());
                    emp.setInternalId(internalId);
                    emp.setFirstName(firstName);
                    emp.setLastName(lastName);
                    emp.setDepartment(dept);
                    emp.setAccessGranted(accessGranted);
                    emp.setActive(active);
                    emp.setPassword(password);

                    employeeRepository.save(emp);
                    agregados++;
                }
            }

            return ResponseEntity.ok("Se procesaron " + agregados + " empleados correctamente.");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error al procesar el archivo CSV: " + e.getMessage());
        }
    }

    private String limpiarTexto(String texto) {
        if (texto == null) return "";
        return texto.trim().replaceAll("^\"|\"$", "");
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateEmployee(@PathVariable Long id, @RequestBody Employee employeeDetails) {
        Optional<Employee> employeeOpt = employeeRepository.findById(id);
        if (employeeOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Empleado no encontrado.");
        }

        Employee employeeToUpdate = employeeOpt.get();
        if (employeeDetails.getInternalId() != null) employeeToUpdate.setInternalId(employeeDetails.getInternalId());
        if (employeeDetails.getFirstName() != null) employeeToUpdate.setFirstName(employeeDetails.getFirstName());
        if (employeeDetails.getLastName() != null) employeeToUpdate.setLastName(employeeDetails.getLastName());
        if (employeeDetails.getAccessGranted() != null) employeeToUpdate.setAccessGranted(employeeDetails.getAccessGranted());
        if (employeeDetails.getActive() != null) employeeToUpdate.setActive(employeeDetails.getActive());

        if (employeeDetails.getDepartment() != null && employeeDetails.getDepartment().getId() != null) {
            departmentRepository.findById(employeeDetails.getDepartment().getId()).ifPresent(employeeToUpdate::setDepartment);
        }

        return ResponseEntity.ok(employeeRepository.save(employeeToUpdate));
    }

    @GetMapping("/validate/{internalId}")
    public ResponseEntity<Map<String, Object>> validateCard(@PathVariable String internalId) {
        Map<String, Object> response = new HashMap<>();
        Optional<Employee> employeeOpt = employeeRepository.findByInternalId(internalId);

        if (employeeOpt.isEmpty()) {
            response.put("valid", false);
            response.put("message", "Carnet no registrado.");
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        }

        Employee employee = employeeOpt.get();
        if (Boolean.FALSE.equals(employee.getActive())) {
            response.put("valid", false);
            response.put("message", "Usuario inhabilitado.");
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
        }

        boolean tieneAcceso = Boolean.TRUE.equals(employee.getAccessGranted());
        response.put("valid", tieneAcceso);
        response.put("message", tieneAcceso ? "Acceso concedido." : "Sin permisos de entrada.");
        if (tieneAcceso) response.put("employee", employee);

        return ResponseEntity.status(tieneAcceso ? HttpStatus.OK : HttpStatus.FORBIDDEN).body(response);
    }

    @DeleteMapping
    public ResponseEntity<String> deleteAllEmployees() {
        employeeRepository.deleteAll();
        return ResponseEntity.ok("Todos los empleados han sido eliminados.");
    }
}
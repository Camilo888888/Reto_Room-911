package com.room911.access_control.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.room911.access_control.model.Department;

public interface DepartmentRepository extends JpaRepository<Department, Long> {
}
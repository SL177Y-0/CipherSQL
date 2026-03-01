CREATE SCHEMA a_001;
CREATE TABLE a_001.employees (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(100),
    salary DECIMAL,
    department_id INT,
    hire_date DATE
);
CREATE TABLE a_001.departments (
    id SERIAL PRIMARY KEY,
    department_name VARCHAR(100),
    manager_id INT,
    budget DECIMAL
);
INSERT INTO a_001.departments (id, department_name, manager_id, budget) VALUES 
(1, 'Engineering', 1, 1000000),
(2, 'Sales', 3, 500000);
INSERT INTO a_001.employees (id, name, email, salary, department_id, hire_date) VALUES 
(1, 'Alice', 'alice@example.com', 120000, 1, '2020-01-15'),
(2, 'Bob', 'bob@example.com', 95000, 1, '2021-03-10'),
(3, 'Charlie', 'charlie@example.com', 110000, 2, '2019-11-01'),
(4, 'David', 'david@example.com', 85000, 2, '2022-06-20'),
(5, 'Eve', 'eve@example.com', 130000, 1, '2018-09-05');

CREATE ROLE cipher_student NOLOGIN;
GRANT CONNECT ON DATABASE ciphersqlstudio_app TO cipher_student;
GRANT USAGE ON SCHEMA a_001 TO cipher_student;
GRANT SELECT ON ALL TABLES IN SCHEMA a_001 TO cipher_student;

CREATE USER student_user WITH PASSWORD 'student_password';
GRANT cipher_student TO student_user;

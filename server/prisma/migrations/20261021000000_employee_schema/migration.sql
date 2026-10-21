CREATE TABLE "employees" (
    "id" UUID NOT NULL,
    "full_name" VARCHAR(150) NOT NULL,
    "email" VARCHAR(200) NOT NULL,
    "job_title" VARCHAR(100) NOT NULL,
    "department" VARCHAR(100) NOT NULL,
    "country" VARCHAR(100) NOT NULL,
    "currency" CHAR(3) NOT NULL,
    "salary" DECIMAL(12,2) NOT NULL,
    "hire_date" DATE NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "employees_salary_positive" CHECK ("salary" > 0)
);

CREATE UNIQUE INDEX "employees_email_key" ON "employees"("email");
CREATE INDEX "employees_country_idx" ON "employees"("country");
CREATE INDEX "employees_department_idx" ON "employees"("department");
CREATE INDEX "employees_job_title_idx" ON "employees"("job_title");
CREATE INDEX "employees_salary_idx" ON "employees"("salary");
CREATE INDEX "employees_country_department_idx" ON "employees"("country", "department");

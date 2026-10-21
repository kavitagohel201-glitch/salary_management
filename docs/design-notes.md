# Salary Management Web App — Design Notes

## Architecture

```mermaid
flowchart LR
    Browser --> React[React UI]
    React --> Routes[Express routes]
    Routes --> Controllers
    Controllers --> Services
    Services --> Repositories
    Repositories --> PostgreSQL
```

## Data model

### `employees`

| Column | Type | Constraints / notes |
|---|---|---|
| `id` | UUID | Primary key |
| `full_name` | `varchar(150)` | Not null |
| `email` | `varchar(200)` | Unique, not null |
| `job_title` | `varchar(100)` | Not null |
| `department` | `varchar(100)` | Not null |
| `country` | `varchar(100)` | Not null |
| `currency` | `char(3)` | ISO code derived from country |
| `salary` | `numeric(12,2)` | Annual, not null, positive |
| `hire_date` | `date` | Not null |
| `created_at`, `updated_at` | `timestamptz` | Creation and last-update timestamps |

Indexes: `country`, `department`, `job_title`, and `salary`; composite `(country, department)`. Search matches full name and email using case-insensitive substring matching; assess trigram indexes if measured query latency warrants them.

## API

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/employees` | List employees; accepts `page`, `pageSize`, `search`, `country`, `department`, `jobTitle`, `sortBy`, and `sortOrder`. Search performs case-insensitive substring matching on full name and email. |
| GET | `/api/employees/:id` | Retrieve one employee. |
| POST | `/api/employees` | Create an employee. |
| PUT | `/api/employees/:id` | Update an employee. |
| DELETE | `/api/employees/:id` | Delete an employee. |
| GET | `/api/meta/filters` | Return distinct countries, departments, and job titles for filter controls. |
| GET | `/api/insights/summary` | Return total headcount and country and department counts. |
| GET | `/api/insights/by-country` | Return headcount and minimum, maximum, average, and median salary per country. |
| GET | `/api/insights/by-department?country=` | Return the same statistics per department, optionally scoped to a country. |
| GET | `/api/insights/by-job-title?country=` | Return the same statistics per job title, optionally scoped to a country. |
| GET | `/api/insights/distribution?country=` | Return salary bands and employee counts, optionally scoped to a country. |


## Performance considerations

- Add indexes for country, department, job title, salary, and `(country, department)` to support the principal filters and insight groupings. Evaluate trigram indexes for full-name and email search if measured query latency warrants them.
- Compute insights in PostgreSQL with aggregate queries rather than loading employee rows into the application to calculate statistics.
- Keep employee listing paginated on the server; apply filtering, sorting, and search in the database before returning each page.
- Seed the 10,000 employees in batches to avoid excessive per-record insert overhead.
- Performance measurements for seed duration, employee-list latency, and insight latency have not been recorded. Capture them against a documented environment and dataset before making performance claims; revisit indexes if measurements show a bottleneck.

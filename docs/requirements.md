# Salary Management Web App — Requirements

## 1. Goal
Replace ACME’s salary spreadsheets with a web app for managing salary data for 10,000 employees across multiple countries and answering how the organization pays people.

## 2. User and key questions HR wants answered
**Primary user:** ACME’s HR Manager.

The app should help answer:
- How many employees are in each country, department, and job title?
- What are the minimum, maximum, average, and median salaries in each group?
- How are salaries distributed across salary bands?
- Which employee records match a search or set of filters?

## 3. In scope (features)
- Create, view, update, and delete employee records, including employee ID, name, country, department, job title, and salary.
- Search employee records; filter by country, department, and job title; sort results; and paginate on the server.
- Show headcount and minimum, maximum, average, and median salary by country, department, and job title. Compute salary averages only within a country.
- Show salary distribution by salary bands, with employee counts per band.
- Provide seed data for 10,000 employees across multiple countries, departments, and job titles.


## 5. Assumptions
- Each country uses a single currency; salaries within a country are comparable and only country-level averages are computed.
- For each country, divide the observed annual salary range into five equal-width bands and count employees in each band; thresholds are country-specific and are not compared across currencies.
- Seed data is representative test data, not ACME’s actual employee data.

## 6. Success criteria
- The app starts with 10,000 seeded employee records distributed across multiple countries, departments, and job titles.
- The HR Manager can create, view, edit, and delete a record, then find it using search and the specified filters.
- Employee lists support sorting and server-side pagination without requiring all records to be loaded at once.
- Insights show correct headcount, minimum, maximum, average, and median for each supported grouping, and salary-band counts reconcile to the relevant headcount.
- No salary average combines employees from different countries.

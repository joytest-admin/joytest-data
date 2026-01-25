# Database Schema

This document describes the database schema for the Joytest application, aligned with the production (Railway) schema.

---

## Enums

### feedback_category

Category of user feedback.

```sql
CREATE TYPE public.feedback_category AS ENUM (
  'bug',
  'feature_request',
  'question',
  'other'
);
```

### feedback_status

Lifecycle status of a feedback item.

```sql
CREATE TYPE public.feedback_status AS ENUM (
  'new',
  'in_progress',
  'resolved',
  'closed'
);
```

---

## Geography (Czech Republic)

Hierarchy: **regions (kraje)** → **districts (okresy)** → **cities (města)**. Used for test-result location and user/doctor location.

### regions

Czech regions (kraje).

```sql
CREATE TABLE public.regions (
  id INTEGER NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

CREATE INDEX idx_regions_name ON regions(name);
```

### districts

Czech districts (okresy).

```sql
CREATE TABLE public.districts (
  id INTEGER NOT NULL,
  name VARCHAR(255) NOT NULL,
  region_id INTEGER NOT NULL REFERENCES regions(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

CREATE INDEX idx_districts_name ON districts(name);
CREATE INDEX idx_districts_region ON districts(region_id);
```

### cities

Czech cities (města).

```sql
CREATE TABLE public.cities (
  id INTEGER NOT NULL,
  name VARCHAR(255) NOT NULL,
  district_id INTEGER NOT NULL REFERENCES districts(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

CREATE INDEX idx_cities_name ON cities(name);
CREATE INDEX idx_cities_district ON cities(district_id);
```

---

## Users Table

Stores administrators and doctors (users). Admins use email/password; doctors can use email/password or passwordless link (ICP + `unique_link_token`).

```sql
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'user')),
  password_hash VARCHAR(255),
  icp_number VARCHAR(255) UNIQUE,
  require_password BOOLEAN NOT NULL DEFAULT false,
  unique_link_token UUID UNIQUE,
  status VARCHAR(20) NOT NULL DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected')),
  city_id INTEGER REFERENCES cities(id),
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now(),

  CONSTRAINT chk_admin_no_icp           CHECK (role != 'admin' OR icp_number IS NULL),
  CONSTRAINT chk_user_has_icp           CHECK (role != 'user' OR icp_number IS NOT NULL),
  CONSTRAINT chk_admin_requires_password  CHECK (role != 'admin' OR require_password = true),
  CONSTRAINT chk_password_required      CHECK (require_password = false OR password_hash IS NOT NULL),
  CONSTRAINT chk_email_required_when_password CHECK (require_password = false OR email IS NOT NULL),
  CONSTRAINT chk_user_has_token_if_no_password CHECK (role != 'user' OR require_password = true OR unique_link_token IS NOT NULL)
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_icp_number ON users(icp_number) WHERE icp_number IS NOT NULL;
CREATE INDEX idx_users_unique_link_token ON users(unique_link_token) WHERE unique_link_token IS NOT NULL;
CREATE INDEX idx_users_status ON users(status) WHERE status = 'pending';
CREATE INDEX idx_users_city_id ON users(city_id) WHERE city_id IS NOT NULL;
```

**Column notes**

| Column | Description |
|--------|-------------|
| **id** | UUID primary key, auto-generated |
| **email** | Unique; null allowed for doctors without password |
| **role** | `'admin'` or `'user'` |
| **password_hash** | bcrypt; required when `require_password = true` |
| **icp_number** | Unique; required for `role = 'user'`, must be null for admin |
| **require_password** | If true, email and password_hash are required |
| **unique_link_token** | For passwordless auth; required for users when `require_password = false` |
| **status** | `pending` (awaiting approval), `approved`, `rejected` |
| **city_id** | Optional FK to `cities`; doctor’s operation city |

**Admin users:** `role = 'admin'`, `icp_number IS NULL`, `require_password = true`, `password_hash` set.

**Regular users (doctors):** `role = 'user'`, `icp_number` set; `require_password` and `unique_link_token` as above.

---

## Patients Table

Anonymized patient identifiers per doctor.

```sql
CREATE TABLE public.patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  identifier VARCHAR(255) NOT NULL,
  note TEXT,
  year_of_birth INTEGER,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_patients_doctor_id ON patients(doctor_id);
CREATE INDEX idx_patients_identifier ON patients(identifier);
CREATE INDEX idx_patients_year_of_birth ON patients(year_of_birth) WHERE year_of_birth IS NOT NULL;
```

- **doctor_id**: Owning doctor (`users.id`)
- **identifier**: Anonymized identifier
- **note**: Optional
- **year_of_birth**: Optional (e.g. 1979)
- Related: `test_results.patient_id`

---

## Test Types Table

Available test types for test results.

```sql
CREATE TABLE public.test_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_test_types_name ON test_types(name);
```

---

## Pathogens Table

Pathogens that can be detected by tests.

```sql
CREATE TABLE public.pathogens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_pathogens_name ON pathogens(name);
```

---

## Test Type Pathogens (Junction)

Many-to-many: which pathogens each test type can detect.

```sql
CREATE TABLE public.test_type_pathogens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_type_id UUID NOT NULL REFERENCES test_types(id) ON DELETE CASCADE,
  pathogen_id UUID NOT NULL REFERENCES pathogens(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  UNIQUE (test_type_id, pathogen_id)
);

CREATE INDEX idx_test_type_pathogens_test_type ON test_type_pathogens(test_type_id);
CREATE INDEX idx_test_type_pathogens_pathogen ON test_type_pathogens(pathogen_id);
```

---

## Vaccinations Table

Vaccination types. Linked to test results via `test_result_vaccinations`.

```sql
CREATE TABLE public.vaccinations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_vaccinations_name ON vaccinations(name);
```

---

## Common Symptoms Table

Reusable symptoms for test results.

```sql
CREATE TABLE public.common_symptoms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_common_symptoms_name ON common_symptoms(name);
```

---

## Test Results Table

Test results entered by doctors.

```sql
CREATE TABLE public.test_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  icp_number VARCHAR(255) NOT NULL,
  test_type_id UUID NOT NULL REFERENCES test_types(id) ON DELETE RESTRICT,
  date_of_birth DATE NOT NULL,
  test_date DATE NOT NULL,
  symptoms TEXT[] NOT NULL,
  other_informations TEXT,
  sari BOOLEAN,
  atb BOOLEAN,
  antivirals BOOLEAN,
  obesity BOOLEAN,
  respiratory_support BOOLEAN,
  ecmo BOOLEAN,
  pregnancy BOOLEAN,
  trimester INTEGER,
  pathogen_id UUID REFERENCES pathogens(id) ON DELETE SET NULL,
  patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
  city_id INTEGER NOT NULL REFERENCES cities(id),
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now(),

  CONSTRAINT check_trimester_valid CHECK (trimester IS NULL OR trimester IN (1, 2, 3))
);

CREATE INDEX idx_test_results_icp_number ON test_results(icp_number);
CREATE INDEX idx_test_results_test_type_id ON test_results(test_type_id);
CREATE INDEX idx_test_results_created_by ON test_results(created_by);
CREATE INDEX idx_test_results_created_at ON test_results(created_at);
CREATE INDEX idx_test_results_city_id ON test_results(city_id);
CREATE INDEX idx_test_results_test_date ON test_results(test_date);
CREATE INDEX idx_test_results_pathogen_id ON test_results(pathogen_id) WHERE pathogen_id IS NOT NULL;
CREATE INDEX idx_test_results_patient_id ON test_results(patient_id);
```

**Column notes**

| Column | Description |
|--------|-------------|
| **icp_number** | Stored value (not FK) |
| **test_type_id** | FK to `test_types` |
| **date_of_birth** | Patient date of birth |
| **test_date** | Date the test was performed |
| **symptoms** | Array of symptom strings |
| **trimester** | 1, 2, or 3; only meaningful when `pregnancy = true` |
| **pathogen_id** | Detected pathogen, if any |
| **patient_id** | Optional link to `patients` |
| **city_id** | FK to `cities`; where the test was performed |
| **created_by** | Doctor who created the record (`users.id`) |

Vaccinations are stored in `test_result_vaccinations`, not on this table.

---

## Test Result Vaccinations (Junction)

Links test results to vaccinations; allows multiple vaccinations per test and per-vaccine details (name, batch, date).

```sql
CREATE TABLE public.test_result_vaccinations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_result_id UUID NOT NULL REFERENCES test_results(id) ON DELETE CASCADE,
  vaccination_id UUID NOT NULL REFERENCES vaccinations(id) ON DELETE RESTRICT,
  vaccine_name VARCHAR(255),
  batch_number VARCHAR(255),
  vaccination_date DATE,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  UNIQUE (test_result_id, vaccination_id)
);

CREATE INDEX idx_test_result_vaccinations_test_result_id ON test_result_vaccinations(test_result_id);
CREATE INDEX idx_test_result_vaccinations_vaccination_id ON test_result_vaccinations(vaccination_id);
```

- **vaccine_name**, **batch_number**, **vaccination_date**: Overrides or supplements the base `vaccinations` record for this row.

---

## Feedback Table

Feedback from doctors, with optional admin handling.

```sql
CREATE TABLE public.feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category feedback_category NOT NULL,
  subject VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  status feedback_status NOT NULL DEFAULT 'new',
  admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
  admin_response TEXT,
  context_url VARCHAR(500),
  resolved_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_feedback_doctor_id ON feedback(doctor_id);
CREATE INDEX idx_feedback_category ON feedback(category);
CREATE INDEX idx_feedback_status ON feedback(status);
CREATE INDEX idx_feedback_created_at ON feedback(created_at);
CREATE INDEX idx_feedback_admin_id ON feedback(admin_id) WHERE admin_id IS NOT NULL;
```

- **doctor_id**: Submitting doctor
- **category**: `feedback_category` enum
- **status**: `feedback_status` enum
- **admin_id**: Admin who handled it (optional)
- **admin_response**: Admin reply
- **context_url**: Page/context where feedback was sent
- **resolved_at**: When the item was resolved

---

## Translations Table

Translations for test types, vaccinations, common symptoms, and pathogens. `entity_id` points to the corresponding `id` in the table implied by `entity_type`.

```sql
CREATE TABLE public.translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type VARCHAR NOT NULL CHECK (entity_type IN ('test_type', 'vaccination', 'common_symptom', 'pathogen')),
  entity_id UUID NOT NULL,
  language_code VARCHAR NOT NULL,
  translation VARCHAR NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  UNIQUE (entity_type, entity_id, language_code)
);

CREATE INDEX idx_translations_entity ON translations(entity_type, entity_id);
CREATE INDEX idx_translations_language ON translations(language_code);
```

- **entity_type**: `test_type`, `vaccination`, `common_symptom`, or `pathogen`
- **entity_id**: UUID of the row in that entity’s table
- **language_code**: e.g. `en-US`, `cs-CZ`
- **translation**: Translated text

---

## Create Order (for migrations)

Because of foreign keys, create objects in this order:

1. Enums: `feedback_category`, `feedback_status`
2. `regions` → `districts` → `cities`
3. `users` (depends on `cities`)
4. `common_symptoms`, `pathogens`, `test_types`, `vaccinations`
5. `test_type_pathogens`
6. `patients` (depends on `users`)
7. `test_results` (depends on `users`, `cities`, `test_types`, `pathogens`, `patients`)
8. `test_result_vaccinations` (depends on `test_results`, `vaccinations`)
9. `feedback` (depends on `users`)
10. `translations` (no FKs; `entity_id` is logical only)

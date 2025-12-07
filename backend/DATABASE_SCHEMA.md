# Database Schema

This document describes the database schema required for the authentication system.

## Users Table

The `users` table stores both administrators and regular users. All users are identified by email.

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NULL, -- NULL allowed for users without password requirement
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'user')),
  password_hash VARCHAR(255) NULL,
  icp_number VARCHAR(255) NULL UNIQUE,
  city VARCHAR(255) DEFAULT '',
  unique_link_token UUID NULL UNIQUE, -- Unique token for passwordless authentication (only for users without password requirement)
  require_password BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_icp_number ON users(icp_number) WHERE icp_number IS NOT NULL;
CREATE INDEX idx_users_unique_link_token ON users(unique_link_token) WHERE unique_link_token IS NOT NULL;

-- Constraints
-- Admins should not have ICP numbers
ALTER TABLE users ADD CONSTRAINT chk_admin_no_icp 
  CHECK (role != 'admin' OR icp_number IS NULL);

-- Users should have ICP numbers
ALTER TABLE users ADD CONSTRAINT chk_user_has_icp 
  CHECK (role != 'user' OR icp_number IS NOT NULL);

-- Admins should always require password
ALTER TABLE users ADD CONSTRAINT chk_admin_requires_password 
  CHECK (role != 'admin' OR require_password = true);

-- If require_password is true, password_hash should not be null
ALTER TABLE users ADD CONSTRAINT chk_password_required 
  CHECK (require_password = false OR password_hash IS NOT NULL);

-- If require_password is true, email should not be null
ALTER TABLE users ADD CONSTRAINT chk_email_required_when_password 
  CHECK (require_password = false OR email IS NOT NULL);

-- Users without password requirement should have a unique_link_token
ALTER TABLE users ADD CONSTRAINT chk_user_has_token_if_no_password
  CHECK (
    (role != 'user' OR require_password = true OR unique_link_token IS NOT NULL)
  );

-- Users with password requirement should not have a unique_link_token
ALTER TABLE users ADD CONSTRAINT chk_user_no_token_if_password
  CHECK (
    (require_password = true OR unique_link_token IS NULL OR role != 'user')
  );
```

## Notes

- **id**: UUID primary key, auto-generated
- **email**: Unique email address for all users
- **role**: Either 'admin' or 'user'
- **password_hash**: Hashed password (bcrypt), null if password not required
- **icp_number**: ICP identification number (only for regular users, null for admins)
- **city**: Optional city where the doctor operates (used for reporting/filtering)
- **unique_link_token**: Unique UUID token for passwordless authentication (only for users without password requirement, null otherwise)
- **require_password**: Boolean indicating if password authentication is required
- **created_at**: Timestamp of creation
- **updated_at**: Timestamp of last update

### Admin Users
- `role = 'admin'`
- `icp_number = NULL`
- `require_password = true` (always)
- `password_hash` must be set

### Regular Users
- `role = 'user'`
- `icp_number` must be set (unique)
- `require_password` can be true or false
- `password_hash` is required if `require_password = true`
- `unique_link_token` is required if `require_password = false` (for passwordless authentication)
- `unique_link_token` must be null if `require_password = true`

## Patients Table

The `patients` table stores anonymized patient identifiers per doctor.

```sql
CREATE TABLE patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  identifier VARCHAR(255) NOT NULL,
  note TEXT,
  year_of_birth INTEGER NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_patients_doctor_id ON patients(doctor_id);
CREATE INDEX idx_patients_identifier ON patients(identifier);
CREATE INDEX idx_patients_year_of_birth ON patients(year_of_birth) WHERE year_of_birth IS NOT NULL;
```

- **doctor_id**: Owning doctor (`users.id`)
- **identifier**: Doctor-provided anonymized identifier
- **note**: Optional note about the patient
- **year_of_birth**: Optional year of birth (integer, e.g., 1979)
- **tests**: Related via `test_results.patient_id`

## Test Types Table

The `test_types` table stores available test types that can be used in test results.

```sql
CREATE TABLE test_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_test_types_name ON test_types(name);
```

## Pathogens Table

The `pathogens` table stores available pathogens that can be detected by tests.

```sql
CREATE TABLE pathogens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_pathogens_name ON pathogens(name);
```

## Test Type Pathogens Junction Table

The `test_type_pathogens` table creates a many-to-many relationship between test types and pathogens, indicating which pathogens each test type can detect.

```sql
CREATE TABLE test_type_pathogens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_type_id UUID NOT NULL REFERENCES test_types(id) ON DELETE CASCADE,
  pathogen_id UUID NOT NULL REFERENCES pathogens(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(test_type_id, pathogen_id)
);

-- Indexes for performance
CREATE INDEX idx_test_type_pathogens_test_type ON test_type_pathogens(test_type_id);
CREATE INDEX idx_test_type_pathogens_pathogen ON test_type_pathogens(pathogen_id);
```

## Vaccinations Table

The `vaccinations` table stores available vaccination types that can be associated with test results.

```sql
CREATE TABLE vaccinations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_vaccinations_name ON vaccinations(name);
```

## Common Symptoms Table

The `common_symptoms` table stores common symptoms that can be used when creating test results.

```sql
CREATE TABLE common_symptoms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_common_symptoms_name ON common_symptoms(name);
```

## Test Results Table

The `test_results` table stores test results entered by doctors (users).

```sql
CREATE TABLE test_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city VARCHAR(255) NOT NULL,
  icp_number VARCHAR(255) NOT NULL,
  test_type_id UUID NOT NULL REFERENCES test_types(id) ON DELETE RESTRICT,
  date_of_birth DATE NOT NULL,
  symptoms TEXT[] NOT NULL,
  pathogen_id UUID NULL REFERENCES pathogens(id) ON DELETE SET NULL,
  other_informations TEXT NULL,
  sari BOOLEAN NULL,
  atb BOOLEAN NULL,
  antivirals BOOLEAN NULL,
  obesity BOOLEAN NULL,
  respiratory_support BOOLEAN NULL,
  ecmo BOOLEAN NULL,
  pregnancy BOOLEAN NULL,
  vaccination_id UUID NULL REFERENCES vaccinations(id) ON DELETE SET NULL,
  patient_id UUID NULL REFERENCES patients(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_test_results_icp_number ON test_results(icp_number);
CREATE INDEX idx_test_results_test_type_id ON test_results(test_type_id);
CREATE INDEX idx_test_results_created_by ON test_results(created_by);
CREATE INDEX idx_test_results_created_at ON test_results(created_at);
CREATE INDEX idx_test_results_vaccination_id ON test_results(vaccination_id) WHERE vaccination_id IS NOT NULL;
CREATE INDEX idx_test_results_pathogen_id ON test_results(pathogen_id) WHERE pathogen_id IS NOT NULL;
CREATE INDEX idx_test_results_patient_id ON test_results(patient_id) WHERE patient_id IS NOT NULL;
```

## Notes

### Test Types
- **id**: UUID primary key, auto-generated
- **name**: Unique name of the test type
- **created_at**: Timestamp of creation
- **updated_at**: Timestamp of last update

### Vaccinations
- **id**: UUID primary key, auto-generated
- **name**: Unique name of the vaccination
- **created_at**: Timestamp of creation
- **updated_at**: Timestamp of last update

### Common Symptoms
- **id**: UUID primary key, auto-generated
- **name**: Unique name of the symptom
- **created_at**: Timestamp of creation
- **updated_at**: Timestamp of last update

### Test Results
- **id**: UUID primary key, auto-generated
- **city**: City where the test was performed
- **icp_number**: ICP number of the patient (not a foreign key, just stored value)
- **test_type_id**: Foreign key to test_types table
- **date_of_birth**: Patient's date of birth
- **symptoms**: Array of symptom strings (required)
- **other_informations**: Optional additional information
- **sari**: Optional boolean flag
- **atb**: Optional boolean flag
- **antivirals**: Optional boolean flag
- **obesity**: Optional boolean flag
- **respiratory_support**: Optional boolean flag
- **ecmo**: Optional boolean flag
- **pregnancy**: Optional boolean flag
- **vaccination_id**: Optional foreign key to vaccinations table
- **created_by**: Foreign key to users table (the doctor who created the record)
- **created_at**: Timestamp of creation
- **updated_at**: Timestamp of last update


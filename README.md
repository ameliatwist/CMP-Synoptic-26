# EcoWaste App

A web app for Birmingham residents to report overflowing bins and earn rewards. Council staff have a separate portal to monitor reports and manage collection routes.

---

## Requirements

- [Node.js](https://nodejs.org/) v18 or later
- [PostgreSQL](https://www.postgresql.org/) v14 or later

---

## Setup

### 1. Install dependencies

```
npm install
```

### 2. Create the database

Open a terminal and run:

```
psql -U postgres
```

Then inside psql:

```sql
CREATE DATABASE ecowaste;
\q
```

### 3. Run the schema

This creates the tables:

```
psql -U postgres -d ecowaste -f schema.sql
```

### 4. Configure database credentials

Open `app/db.js` and fill in your PostgreSQL details, or set environment variables:

| Variable        | Default     | Description              |
|-----------------|-------------|--------------------------|
| `DB_USER`       | `postgres`  | PostgreSQL username      |
| `DB_HOST`       | `localhost` | PostgreSQL host          |
| `DB_NAME`       | `ecowaste`  | Database name            |
| `DB_PASSWORD`   | `password`  | PostgreSQL password      |
| `DB_PORT`       | `5432`      | PostgreSQL port          |
| `SESSION_SECRET`| `ecowaste-secret` | Session signing key |

Example (Windows PowerShell):

```powershell
$env:DB_PASSWORD = "yourpassword"
node app/server.js
```

### 5. Start the server

```
node app/server.js
```

The app will be running at **http://localhost:3000**

---

## Pages

| URL | Description |
|-----|-------------|
| `/login` | Resident login |
| `/create` | Create a resident account |
| `/index` | Resident home (requires login) |
| `/rewards` | Points and rewards (requires login) |
| `/council-login` | Council staff login |
| `/council-dashboard` | Council dashboard (requires council login) |
| `/council-routes` | Collection routes (requires council login) |

---

## Adding a Council Staff Account

Council staff accounts are not created through the app. Insert one directly into the database.

First hash a password using Node.js:

```
node -e "const b = require('bcrypt'); b.hash('yourpassword', 10).then(h => console.log(h))"
```

Then insert into the database:

```sql
INSERT INTO council_staff (fullname, username, email, password)
VALUES ('Admin User', 'admin', 'admin@council.gov.uk', '<paste hashed password here>');
```

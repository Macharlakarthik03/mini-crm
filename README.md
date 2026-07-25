# Mini CRM — Client Lead Management System

A complete full-stack Mini CRM built for Internship Task 2.

**Stack:** HTML, CSS, JavaScript (frontend) · Node.js + Express.js (backend) · MySQL (database)

---

## Features

- 🔐 Admin login with JWT authentication (bcrypt-hashed passwords)
- 📊 Dashboard with live stats — Total, New, Contacted, Converted leads
- 👥 Full lead CRUD — add, view, edit, delete
- 🔍 Search leads by name or email
- 🧮 Filter leads by status
- ↕️ Sort leads by latest/oldest
- 🏷️ Inline status change (New → Contacted → Converted)
- 📝 Add/edit notes per lead
- ✅ Server-side + client-side validation (required fields, email format, duplicate email prevention)
- 📱 Fully responsive, modern UI with sidebar navigation, Font Awesome icons, and smooth animations
- 🔔 Success/error toast notifications

---

## Project Structure

```
mini-crm/
├── backend/                     # Node.js + Express API (MVC)
│   ├── config/
│   │   └── db.js                # MySQL connection pool
│   ├── controllers/
│   │   ├── authController.js    # Login logic
│   │   └── leadController.js    # Lead CRUD logic + validation
│   ├── middleware/
│   │   └── authMiddleware.js    # JWT verification
│   ├── models/
│   │   ├── adminModel.js        # Admin DB queries
│   │   └── leadModel.js         # Lead DB queries
│   ├── routes/
│   │   ├── authRoutes.js
│   │   └── leadRoutes.js
│   ├── utils/
│   │   └── generateHash.js      # Helper to create bcrypt password hashes
│   ├── .env                     # Environment config (edit this)
│   ├── .env.example
│   ├── package.json
│   └── server.js                # App entry point
│
├── frontend/                    # Static HTML/CSS/JS client
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   ├── api.js               # Fetch wrapper, auth helpers, toasts
│   │   ├── login.js
│   │   ├── dashboard.js
│   │   └── leads.js
│   ├── index.html               # Login page
│   ├── dashboard.html
│   └── leads.html
│
├── database/
│   └── schema.sql                # Full DB schema + seed data
│
└── README.md
```

---

## Prerequisites

- [Node.js](https://nodejs.org) v16 or higher
- [MySQL](https://www.mysql.com/) v8 (or MariaDB equivalent) installed and running
- npm (comes with Node.js)

---

## Installation Steps

### 1. Create the database

Open your MySQL client (MySQL Workbench, `mysql` CLI, phpMyAdmin, etc.) and run the provided SQL file:

```bash
mysql -u root -p < database/schema.sql
```

This will:
- Create the `mini_crm` database
- Create the `admins` and `leads` tables
- Insert a default admin account and 5 sample leads

**Default admin login:**
```
Username: admin
Password: admin123
```

### 2. Configure environment variables

Navigate to the backend folder and edit the `.env` file with your MySQL credentials:

```bash
cd backend
```

Open `.env` and update:

```
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=mini_crm
DB_PORT=3306
JWT_SECRET=mini_crm_super_secret_key_change_this_in_production
JWT_EXPIRES_IN=8h
```

> An `.env.example` file is also provided as a template.

### 3. Install backend dependencies

```bash
npm install
```

This installs: `express`, `mysql2`, `bcryptjs`, `jsonwebtoken`, `cors`, `dotenv`, and `nodemon` (dev).

### 4. Run the server

For development (auto-restarts on file changes):
```bash
npm run dev
```

For production:
```bash
npm start
```

You should see:
```
✅ MySQL connected successfully.
🚀 Mini CRM server running at http://localhost:5000
```

### 5. Open the app

The Express server also serves the frontend as static files, so simply open:

```
http://localhost:5000
```

in your browser. Log in with the default admin credentials above.

---

## Creating Additional Admin Users

Use the included helper script to generate a bcrypt hash for a new password:

```bash
cd backend
node utils/generateHash.js myNewPassword123
```

Copy the printed `INSERT INTO admins...` statement and run it in your MySQL client.

---

## API Endpoints Reference

| Method | Endpoint                  | Description                          | Auth Required |
|--------|----------------------------|---------------------------------------|----------------|
| POST   | `/api/auth/login`          | Admin login, returns JWT token        | No             |
| GET    | `/api/auth/verify`         | Verify current token                  | Yes            |
| GET    | `/api/leads`                | Get all leads (supports `?search=&status=&sort=`) | Yes |
| GET    | `/api/leads/stats`          | Get dashboard stats                   | Yes             |
| GET    | `/api/leads/:id`            | Get a single lead                     | Yes             |
| POST   | `/api/leads`                 | Create a new lead                     | Yes             |
| PUT    | `/api/leads/:id`             | Update a lead                         | Yes             |
| PATCH  | `/api/leads/:id/status`      | Update only the lead's status         | Yes             |
| PATCH  | `/api/leads/:id/notes`       | Update only the lead's notes          | Yes             |
| DELETE | `/api/leads/:id`             | Delete a lead                         | Yes             |

All protected routes require an `Authorization: Bearer <token>` header. The frontend handles this automatically once you're logged in.

---

## Validation Rules

- **Name:** required, minimum 2 characters
- **Email:** required, must match a valid email format, must be unique across all leads (enforced both in the app logic and via a MySQL `UNIQUE` constraint)
- **Phone:** required, 7–20 characters (digits, spaces, `+`, `-`, parentheses allowed)
- **Source:** required, must be one of: Website, Facebook, Instagram, LinkedIn, Referral
- **Status:** must be one of: New, Contacted, Converted

---

## Troubleshooting

**"MySQL connection failed" on server start**
- Confirm MySQL is running (`sudo service mysql status` / check MySQL Workbench).
- Double-check `DB_USER`, `DB_PASSWORD`, and `DB_NAME` in `backend/.env`.
- Confirm you ran `database/schema.sql` to create the `mini_crm` database.

**Login fails with correct credentials**
- Make sure `schema.sql` was executed fully (it inserts the default admin row with a pre-hashed password).
- Check the backend console for errors.

**Port already in use**
- Change `PORT` in `backend/.env` to a free port (e.g., `5001`).

---

## License

Built for educational/internship purposes.

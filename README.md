# DAYFLOW – Human Resource Management System
### *Every workday, perfectly aligned.*

[![License: MIT](https://img.shields.io/badge/License-MIT-indigo.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-emerald.svg)](https://nodejs.org)
[![Express.js](https://img.shields.io/badge/express-4.21.2-blue.svg)](https://expressjs.com)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose%208.9-green.svg)](https://mongoosejs.com)
[![Security: JWT & Bcrypt](https://img.shields.io/badge/Security-JWT%20%2B%20Bcrypt-violet.svg)](https://jwt.io)

---

## 🌟 1. Product Vision & Overview

**DAYFLOW** is a modern, enterprise-grade SaaS Human Resource Operating Platform designed to eliminate workplace administrative friction. Instead of traditional, clunky, fragmented HR dashboards, Dayflow structures the entire employee experience along the natural workday flow:

$$\text{Identity} \longrightarrow \text{Attendance} \longrightarrow \text{Leave} \longrightarrow \text{Payroll} \longrightarrow \text{Insights}$$

Dayflow delivers a sleek, responsive design language inspired by modern SaaS platforms like Linear, Stripe, and Notion—featuring dark glassmorphism, real-time stopwatch work clocks, mathematical workforce analytics, and printable salary slips.

---

## ⚡ 2. Unique Product Experience: DAYFLOW PULSE

**Dayflow Pulse** is a live, interactive daily employee rhythm engine that instantly answers:
* *How is my workday going?*
* *Did I check in on time?*
* *How many hours have I actively logged?*
* *Do I have pending time-off requests?*
* *What is my net take-home compensation?*

### "Today's Flow" Visual Workday Progression:
```
Morning  ──▶  Check In  ──▶  Working (Live Clock)  ──▶  Break / Lunch  ──▶  Check Out  ──▶  Daily Summary
```

---

## 🚀 3. Key Feature Matrix

| Module | Employee Features | HR / Administrator Features |
| :--- | :--- | :--- |
| **Dayflow Pulse** | Personalized greeting, live work timer, break toggling, Today's Flow timeline | Executive KPIs, "Needs Attention" triage feed, presence board |
| **Attendance Hub** | Daily/weekly/monthly calendar matrix, punch-in/out, late alerts, work duration logs | Multi-filter attendance roster (Date, Department, Status, Search), presence metrics |
| **Leave Command Center** | Paid/Sick/Casual/Unpaid balances, 1-click application modal, status timeline | Review queue, 1-click Approve / Reject with reviewer feedback, collision detection |
| **Payroll & Compensation** | Breakdown of earnings vs deductions (HRA, PF, TDS), official printable salary slips | Structure customization, automated monthly batch generator, disbursement audit |
| **Employee Directory** | Staff roster lookup, role and department directory | Create staff, promote/reassign, edit all fields, activate/deactivate accounts |
| **Dayflow Insights** | Team punctuality benchmark overview | Calculated statistics: Department rankings, attendance shifts, outlier alerts |
| **Reports & Export** | Attendance and PTO history views | Custom date/dept filters, audit datasets, Print preview, instant CSV export |
| **Command Palette (`Ctrl+K`)** | Instant fuzzy search across records, leaves, slips | Global search for all employees, quick admin actions, keyboard navigation |

---

## 🔑 4. Demo Credentials

The database is pre-seeded with realistic 30-day attendance history, diverse leave requests, and processed salary slips. You can sign in using 1-click buttons on the login page or manual entry:

| Role | Name | Email | Password | Employee ID | Department |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **HR / Admin** | Sarah Jenkins | `sarah.hr@dayflow.io` | `Dayflow@2026` | `DF-1001` | Human Resources |
| **Employee 1** | Alex Chen | `alex.chen@dayflow.io` | `Dayflow@2026` | `DF-1002` | Engineering |
| **Employee 2** | Priya Sharma | `priya.sharma@dayflow.io` | `Dayflow@2026` | `DF-1003` | Design |
| **Employee 3** | Marcus Vance | `marcus.vance@dayflow.io` | `Dayflow@2026` | `DF-1004` | Marketing |

---

## 🛠️ 5. Technology Stack & Architecture

* **Backend**: Node.js, Express.js (REST API, Middleware, Error Handling)
* **Database**: MongoDB with Mongoose ODM (Auto in-memory fallback enabled)
* **Authentication**: JSON Web Tokens (JWT), Bcrypt password hashing, Strict RBAC
* **Frontend**: Vanilla ES6+ Modular JavaScript, Custom SaaS CSS Design System, Responsive Glassmorphism Layout
* **Visuals & Assets**: Custom SVG brand vectors, dynamic canvas gauges, printable payslip templates

---

## 💻 6. Quickstart & Installation

### Prerequisites:
* [Node.js](https://nodejs.org/) (v18.0.0 or higher)
* [npm](https://www.npmjs.com/) (v9.0.0 or higher)
* *Optional*: Local MongoDB instance. *(If MongoDB is not running locally, Dayflow auto-starts an embedded memory database with full persistence during runtime).*

### 1. Clone or Open the Repository
```bash
cd Dayflow
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Environment Variables
Create a `.env` file in the root directory (or copy from `.env.example`):
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/dayflow
JWT_SECRET=dayflow_super_secret_jwt_key_2026_secure_random_seed_99482
JWT_EXPIRES_IN=7d
```

### 4. Start the Application
```bash
npm start
```
*Or for live reloading during development:*
```bash
npm run dev
```

### 5. Access Dayflow in Your own Browser
* 🌐 **Public Landing Page**: [http://localhost:5000](http://localhost:5000)
* 🔐 **Login & Demo Switcher**: [http://localhost:5000/login.html](http://localhost:5000/login.html)
* 💻 **Application Workspace**: [http://localhost:5000/app.html](http://localhost:5000/app.html)

---

## 📖 7. REST API Documentation

### Authentication (`/api/auth`)
* `POST /api/auth/register`: Create a new user account with role validation.
* `POST /api/auth/login`: Authenticate via email or Employee ID; returns JWT token + user profile.
* `GET /api/auth/me`: Fetch authenticated user profile.

### Employees (`/api/employees`)
* `GET /api/employees`: Search, filter by department/status, retrieve staff directory.
* `GET /api/employees/:id`: Retrieve single employee profile and work stats.
* `PUT /api/employees/:id`: Update employee profile (Strict RBAC: Employees edit contact; Admins edit all).
* `POST /api/employees`: *(Admin)* Add new staff member and initialize payroll structure.
* `PATCH /api/employees/:id/status`: *(Admin)* Activate/Deactivate staff member.

### Attendance (`/api/attendance`)
* `POST /api/attendance/check-in`: Clock in for the current workday.
* `POST /api/attendance/check-out`: Finish workday, compute total work minutes and breaks.
* `POST /api/attendance/break-toggle`: Start or finish a break period.
* `GET /api/attendance/today`: Get current day's live clocking state.
* `GET /api/attendance/my-history`: Get user's monthly attendance logs.
* `GET /api/attendance/stats`: Get punctuality rate, presence count, and average work hours.
* `GET /api/attendance/all`: *(Admin)* Filterable attendance roster and daily presence metrics.

### Leaves (`/api/leaves`)
* `POST /api/leaves`: Submit a time-off request with start date, end date, and reason.
* `GET /api/leaves/my-leaves`: Fetch personal leave request history and PTO balances.
* `GET /api/leaves/all`: *(Admin)* Access all leave requests across the company.
* `PATCH /api/leaves/:id/review`: *(Admin)* Approve or reject a leave request with comments.

### Payroll (`/api/payroll`)
* `GET /api/payroll/my-payroll`: Fetch personal payslip history and salary breakdown.
* `GET /api/payroll/all`: *(Admin)* View company-wide payroll records and disbursement totals.
* `GET /api/payroll/slip/:id`: Fetch itemized payslip for rendering, printing, or PDF export.
* `PUT /api/payroll/structure/:userId`: *(Admin)* Adjust compensation structure.
* `POST /api/payroll/generate-batch`: *(Admin)* Run monthly payroll calculation batch.

### Insights & Intelligence (`/api/insights`)
* `GET /api/insights`: Returns calculated punctuality trends, department rankings, and anomaly alerts.

### Reports (`/api/reports`)
* `GET /api/reports/attendance`: Exportable attendance aggregated data.
* `GET /api/reports/leaves`: Exportable leave utilization data.
* `GET /api/reports/payroll`: Exportable payroll budget and deduction data.
* `GET /api/reports/employees`: Exportable employee master roster.

---

## 📁 8. Project Directory Structure

```
dayflow/
├── backend/
│   ├── config/
│   │   └── db.js                 # MongoDB connection & memory fallback
│   ├── controllers/
│   │   ├── authController.js     # Login, register, profile
│   │   ├── employeeController.js # Directory & profile management
│   │   ├── attendanceController.js # Live punch-in/out & history
│   │   ├── leaveController.js    # Time-off workflow & balances
│   │   ├── payrollController.js  # Salary slips & batch processing
│   │   ├── insightController.js  # Calculated workforce intelligence
│   │   ├── notificationController.js # Alerts & broadcasts
│   │   └── reportController.js   # Audit datasets & export
│   ├── middleware/
│   │   ├── authMiddleware.js     # JWT verification
│   │   ├── roleMiddleware.js     # Role-based access control
│   │   └── errorMiddleware.js    # Centralized error handler
│   ├── models/
│   │   ├── User.js               # Staff & auth schema
│   │   ├── Attendance.js         # Daily clocking & breaks schema
│   │   ├── Leave.js              # Time-off requests schema
│   │   ├── Payroll.js            # Itemized salary slip schema
│   │   └── Notification.js       # System notifications schema
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── employeeRoutes.js
│   │   ├── attendanceRoutes.js
│   │   ├── leaveRoutes.js
│   │   ├── payrollRoutes.js
│   │   ├── insightRoutes.js
│   │   ├── notificationRoutes.js
│   │   └── reportRoutes.js
│   ├── utils/
│   │   ├── seedData.js           # 30-day realistic company seed generator
│   │   └── tokenUtils.js         # JWT signing & validation
│   └── server.js                 # Express server & static asset host
├── frontend/
│   ├── assets/
│   │   ├── logo.svg              # Brand vector logo
│   │   └── favicon.svg           # Brand favicon
│   ├── css/
│   │   └── styles.css            # SaaS design system & print styles
│   ├── js/
│   │   ├── api.js                # HTTP client & Toast manager
│   │   ├── auth.js               # Auth & 1-click demo switcher
│   │   ├── pulse.js              # Dayflow Pulse live clock engine
│   │   ├── attendance.js         # Calendar matrix & roster
│   │   ├── leaves.js             # Leave workflow & approval triage
│   │   ├── payroll.js            # Payslips & print engine
│   │   ├── directory.js          # Staff directory & profile editor
│   │   ├── insights.js           # Calculated intelligence widgets
│   │   ├── reports.js            # Report generator & CSV exporter
│   │   ├── notifications.js      # Dropdown & announcements
│   │   ├── commandPalette.js     # Ctrl+K global search
│   │   └── app.js                # App router & state manager
│   ├── index.html                # Public Landing Page
│   ├── login.html                # Split-screen login & demo switcher
│   ├── signup.html               # Registration page with strength meter
│   └── app.html                  # Full-featured SaaS application
├── .env.example
├── .gitignore
├── LICENSE
├── package.json
└── README.md
```

---

## 🔒 9. Security & Enterprise Compliance

1. **Password Hashing**: Bcrypt with 10 salt rounds used for all stored passwords. Passwords are never returned in API payloads (`select: false`).
2. **Stateless JWT Session Management**: High-entropy tokens signed with SHA-256 and expiration handling.
3. **Role-Based Access Control (RBAC)**: Fine-grained endpoint authorization guarding employee-only vs. admin-only actions.
4. **Data Isolation & Profile Protection**: Regular employees are restricted from altering compensation, roles, or other employees' records.
5. **No Hardcoded Secrets**: Fully configurable environment variables with secure defaults.

---

## 🚀 10. How to Upload to GitHub

To push Dayflow to your GitHub repository, execute the following commands in your terminal:

```bash
# 1. Initialize git repository
git init

# 2. Stage all files
git add .

# 3. Commit files
git commit -m "Initial commit: DAYFLOW Human Resource Management System"

# 4. Rename default branch to main
git branch -M main

# 5. Link your GitHub remote repository (replace with your repo URL)
git remote add origin YOUR_REPOSITORY_URL

# 6. Push to GitHub
git push -u origin main
```

---

## 🏆 11. Hackathon Demonstration Walkthrough

When presenting Dayflow to judges, recruiters, or stakeholders, follow this recommended walkthrough flow:

1. **Landing Page (`/`)**: Show the hero section ("Every workday, perfectly aligned."), workflow progression pill strip, and interactive dashboard preview.
2. **Employee Experience**:
   * Click **Try Live Demo** and sign in as **Alex Chen** (1-click login).
   * Demonstrate **Dayflow Pulse**: show the live work timer, click **Punch In**, watch the live stopwatch begin ticking.
   * Toggle a **Break** and show how break duration is separated from productive work time.
   * Apply for a 3-day **Paid Leave** with reason.
   * Open **Payroll & Slips** and click **View Slip** to show the printable salary slip.
   * Press `Ctrl + K` to trigger the **Command Palette** and navigate instantly.
3. **HR Administrator Experience**:
   * Sign out and 1-click login as **Sarah Jenkins** (HR / Admin).
   * Demonstrate the **HR Command Center**: executive presence KPIs, live "Needs Attention" triage feed.
   * Open **Leave Command Center**: view Alex's pending request, click **Review Request**, add approval remarks, and approve it.
   * Open **Employee Directory**: filter by department, search, view staff profile modal.
   * Open **Dayflow Insights**: highlight the calculated mathematical insights (department rankings, punctuality improvement, anomaly flags).
   * Open **Analytics & Reports**: generate an Attendance Report and click **Export to CSV**.

---

## 📄 License
This project is licensed under the MIT License - see the (LICENSE) file for details

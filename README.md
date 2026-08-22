# Dayflow

## Human Resource Management System

**Odoo × NMIT Bangalore Hackathon 2026**

> **Every workday, perfectly aligned.**

---

## 🚀 Overview

**Dayflow** is a role-based Human Resource Management System designed to bring essential HR operations into one connected workspace.

The system covers employee profile management, attendance, leave management, payroll visibility, approval workflows, notifications, and HR reporting.

Dayflow provides two dedicated experiences:

* **Employee Workspace** — focused on personal information, attendance, leave, and payroll visibility.
* **HR / Admin Workspace** — focused on employee management, attendance monitoring, approvals, payroll control, and reporting.

The goal is to make everyday HR operations easier to manage through a centralized and role-based system.

---

## 🎯 Problem

Routine HR activities involve multiple processes such as:

* Maintaining employee information
* Tracking attendance
* Handling leave requests
* Reviewing approvals
* Managing salary information
* Generating HR reports

Managing these activities separately can make it difficult to maintain a consistent view of employee information and workflow status.

**Dayflow** brings these core HR activities together in one structured workspace.

---

## 💡 Our Approach

Dayflow connects the major HR workflows around the employee record.

```text
                    DAYFLOW
                       │
        ┌──────────────┴──────────────┐
        │                             │
    EMPLOYEE                      HR / ADMIN
        │                             │
        ▼                             ▼
   ┌─────────┐                 ┌─────────────┐
   │ Profile │                 │ Employees   │
   └────┬────┘                 └──────┬──────┘
        │                             │
   ┌────▼─────┐                 ┌─────▼──────┐
   │Attendance│                 │ Attendance │
   └────┬─────┘                 └─────┬──────┘
        │                             │
   ┌────▼────┐                  ┌─────▼──────┐
   │  Leave  │◄──── Workflow ──►│  Approval  │
   └────┬────┘                  └─────┬──────┘
        │                             │
   ┌────▼────┐                  ┌─────▼──────┐
   │ Payroll │                  │  Payroll   │
   └─────────┘                  └─────┬──────┘
                                      │
                                ┌─────▼──────┐
                                │ Reports &  │
                                │ Analytics  │
                                └────────────┘
```

---

# 👥 User Roles

## 👤 Employee

Employees have access to their own workspace.

### Profile

* Personal information
* Job details
* Salary structure
* Documents
* Profile picture

### Attendance

* Check-in
* Check-out
* Daily view
* Weekly view
* Attendance status

### Leave

* Apply for leave
* Select leave type
* Choose date range
* Add remarks
* Track request status

### Payroll

* View salary information
* View payroll information

---

## 🛡️ HR / Admin

HR and Admin users have management-level access.

### Employee Management

* View employee list
* Switch between employee records
* Manage employee information
* Update employee details

### Attendance

* View employee attendance
* Monitor attendance status
* Access daily and weekly records

### Leave Management

* Review leave requests
* Approve requests
* Reject requests
* Add comments

### Payroll

* View employee payroll
* Update salary structures
* Maintain payroll information

### Reports

* Attendance reports
* Salary-related reports
* Salary slips
* HR analytics

---

# 🔐 Authentication & Authorization

Dayflow follows role-based access throughout the application.

### Registration

Users register using:

* Employee ID
* Email
* Password
* Role

### Authentication

* Secure sign-in
* Password validation
* Email verification
* Role-based redirection
* Appropriate access based on user role

```text
                 LOGIN
                   │
          ┌────────┴────────┐
          │                 │
       EMPLOYEE          HR / ADMIN
          │                 │
          ▼                 ▼
     Employee UI        Admin UI
```

---

# ⏱️ Attendance Workflow

Dayflow keeps attendance simple and structured:

```text
CHECK IN
   │
   ▼
WORKING
   │
   ▼
CHECK OUT
```

### Attendance Status

* Present
* Absent
* Half-day
* Leave

Employees can access their own attendance records, while HR/Admin can view attendance across employees.

---

# 🏖️ Leave Workflow

```text
Employee
   │
   ▼
Apply Leave
   │
   ▼
Pending
   │
   ├──────────────┐
   ▼              ▼
Approved        Rejected
   │
   ▼
Employee Record Updated
```

### Leave Types

* Paid Leave
* Sick Leave
* Unpaid Leave

### Request Information

* Leave type
* Date range
* Remarks

HR/Admin users can review leave requests, approve or reject them, and add comments.

---

# 💰 Payroll Visibility

Dayflow separates payroll access based on user role.

### Employee

**Read-only access**

Employees can view their salary and payroll information without modifying it.

### HR / Admin

HR/Admin users can:

* View employee payroll
* Update salary structures
* Maintain payroll information

---

# 📊 HR Insights

The system includes scope for HR-level visibility through:

* Attendance reports
* Salary reports
* Salary slips
* Analytics dashboard
* Email notifications
* Activity alerts

---

# ✨ Why Dayflow?

Dayflow is structured around connected HR workflows rather than treating each HR activity as a separate process.

### 01 — Role-aware experience

Employees and HR/Admin users receive access according to their responsibilities.

### 02 — Workflow-based operations

Important HR activities follow clear and understandable states.

**Leave**

`Pending → Approved / Rejected`

**Attendance**

`Check-in → Working → Check-out`

### 03 — Centralized employee information

Profile, attendance, leave, and payroll information are organized around the employee record.

### 04 — Management visibility

HR/Admin users get a broader view of employees, attendance, approvals, payroll, and reports.

---

# 🧩 Core Modules

| Module              | Employee | HR / Admin |
| ------------------- | :------: | :--------: |
| Authentication      |     ✓    |      ✓     |
| Profile             |     ✓    |      ✓     |
| Attendance          |     ✓    |      ✓     |
| Leave               |     ✓    |      ✓     |
| Leave Approval      |     —    |      ✓     |
| Payroll View        |     ✓    |      ✓     |
| Salary Management   |     —    |      ✓     |
| Employee Management |     —    |      ✓     |
| Reports & Analytics |     —    |      ✓     |

---

# 🏗️ Project Structure

```text
dayflow/
│
├── frontend/
│   ├── components/
│   ├── pages/
│   ├── layouts/
│   └── services/
│
├── backend/
│   ├── routes/
│   ├── controllers/
│   ├── models/
│   ├── middleware/
│   └── services/
│
├── README.md
└── .gitignore
```

> The final structure will evolve during implementation.

---

# 🛠️ Technology & Engineering Focus

The final technology stack will be documented as the implementation progresses.

The project is being developed with focus on:

* Responsive web interface
* Secure authentication
* Role-based authorization
* Structured backend APIs
* Persistent data management
* Maintainable project architecture
* Clear separation between employee and HR/Admin workflows

---

# 🔄 Development Flow

```text
Problem Analysis
       ↓
System Design
       ↓
Authentication
       ↓
Role-based Dashboards
       ↓
Employee Management
       ↓
Attendance
       ↓
Leave Workflow
       ↓
Payroll
       ↓
Reports & Analytics
       ↓
Testing
       ↓
Deployment
```

---

# 🎯 Project Goal

Dayflow aims to provide a practical HR workspace where employees can manage their everyday HR activities while HR/Admin teams can manage workforce information and approval workflows from a centralized system.

> **One workforce. One workspace. One Dayflow.**

---

# 👨‍💻 Team

**Team Leader:** Rubitha

**Hackathon:** Odoo × NMIT Bangalore Hackathon 2026

---

# 📌 Project Status

**🚧 Under Development**

This project is being developed for the **Odoo × NMIT Bangalore Hackathon 2026** based on the Dayflow HRMS problem statement.

---

## 📄 Problem Statement

**Dayflow — Human Resource Management System**

The project covers employee onboarding, profile management, attendance tracking, leave management, payroll visibility, approval workflows, notifications, and HR reporting.

---

## License

This project is developed as part of the **Odoo × NMIT Bangalore Hackathon 2026**.

# 🎓 EduManage — Multi-Institutional School & College Management System

<div align="center">

![Next.js 16](https://img.shields.io/badge/Next.js_16-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![React 19](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Prisma ORM](https://img.shields.io/badge/Prisma_5-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![NextAuth.js](https://img.shields.io/badge/NextAuth.js-purple?style=for-the-badge&logo=auth0&logoColor=white)
![SQLite / PostgreSQL](https://img.shields.io/badge/Database-SQLite_/_Postgres-blue?style=for-the-badge&logo=sqlite&logoColor=white)

**A next-generation, multi-tenant academic management platform featuring Central Multi-Principal Administration, Institutional Oversight Dossiers, Date-Matrix Attendance Registers, Student/Teacher Portals, Examination Grading, and Automated Fee Tracking.**

[Features](#-key-features) • [Participating Campuses](#-participating-campuses--institutions) • [Installation](#-getting-started) • [Architecture](#-project-architecture) • [Tech Stack](#-tech-stack)

</div>

---

## 🌟 Highlights

* 🛡️ **Central Multi-Principal Command Hub**: Super Admin authority to appoint, monitor, manage credentials, and oversee Principals across multiple independent schools and engineering colleges.
* 🏛️ **Institutional Oversight & Inspection**: Deep-dive into any campus (Engineering Colleges, CBSE/ICSE Schools, Pre-University Colleges) with visibility over enrolled students, faculty rosters, classes, fee collections, and exams.
* 📅 **Date-Matrix Attendance Register**: Horizontal monthly calendar matrix (Dates `1` to `31`) with 1-row-per-person view, quick bulk-marking, check-in time logging, and attendance percentage metrics for both **Students** and **Faculty**.
* 🔒 **Role-Based Multi-Tenancy**: Complete database and route segregation across **Major Admin**, **Principals**, **Teachers**, and **Students** with automatic institution scoping.
* 🎨 **Dark-Mode Glassmorphism Aesthetic**: Curated HSL color palettes, responsive typography, micro-interactions, and accessible UI.

---

## 🚀 Key Features

### 1. 🛡️ Major Admin — Multi-Principal Command Center (`/admin`)
* **Principal Directory**: Manage appointed Principals across various schools and engineering colleges.
* **Campus Scale Metrics**: Aggregate student counts, faculty headcounts, and division numbers.
* **Credential Management**: Reset or change passwords for campus administrative accounts.
* **Interactive Inspection Modal**: Oversight across 6 dedicated tabs (*Campus Overview*, *Student Roster*, *Faculty Staff*, *Classes & Divisions*, *Fee Collections*, *Examinations*).

### 2. 🏛️ Campus Principal Portal
* **Institutional Student & Faculty Management**: Scoped strictly to the Principal's school or college.
* **Academic Division Control**: Create and manage classes, sections, and class teacher assignments.
* **Dual-Tab Attendance Hub**:
  * **🎓 Student Attendance**: Class-wise date matrix, quick "All Present/Absent" toggles, excuse notes.
  * **🧑‍🏫 Faculty Attendance**: Department-wise date matrix with check-in time logger and approved leave tracking.
* **Fee Collection & Invoicing**: Track tuition, lab fees, exam dues, paid records, and pending balances.
* **Exam Management & Performance**: Schedule exams, input total marks, and inspect student report cards.

### 3. 🧑‍🏫 Teacher Portal (`/teacher`)
* **Class Roster & Student Directory**: View students enrolled in assigned classes.
* **Result & Grade Entry**: Enter exam marks, calculate percentage, and auto-assign letter grades.
* **Attendance Logger**: Mark daily classroom attendance with instant summary stats.
* **Announcements**: Broadcast messages to classes and students.

### 4. 🎓 Student Portal (`/student`)
* **Personal Academic Dashboard**: Quick stats on attendance rate, enrolled division, and overall GPA.
* **Report Cards & Exam Results**: View subject-wise scores, grade classifications, and teacher remarks.
* **Fee Receipts & Payment Status**: Transparent record of tuition, lab fees, and dues.
* **Live Timetable & Announcements**: Campus notifications and class schedules.

---

## 🏛️ Participating Campuses & Institutions

1. 🏢 **Atria Institute of Technology (Atria IT), Bengaluru** *(Engineering College — B.E. CS, ECE, Mech)*
2. 🏫 **National Public School, Indiranagar** *(Senior Secondary CBSE)*
3. 🏫 **Delhi Public School, Whitefield** *(High School & Senior Secondary)*
4. 🏛️ **St. Joseph's Pre-University College** *(Pre-University PCMB & PCMC)*
5. 🏫 **Bishop Cotton Academy, Richmond Town** *(High School ICSE)*
6. 🏛️ **RV Pre-University College, Jayanagar** *(Pre-University PCME)*

---

## 💻 Tech Stack

* **Framework**: [Next.js 16 (App Router)](https://nextjs.org/)
* **Library**: [React 19](https://react.dev/)
* **Language**: [TypeScript](https://www.typescriptlang.org/)
* **Database & ORM**: [Prisma ORM](https://www.prisma.io/) with SQLite (development) / PostgreSQL (production ready)
* **Authentication**: [NextAuth.js (JWT Strategy)](https://next-auth.js.org/)
* **Icons**: [Lucide React](https://lucide.dev/)
* **Date Utilities**: [date-fns](https://date-fns.org/)
* **Styling**: Vanilla CSS Design System with custom dark-mode glassmorphism tokens

---

## 🛠️ Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/CODSOFT_TASK01.git
cd CODSOFT_TASK01
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Environment Variables
Create a `.env` file in the root directory:
```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_URL="http://localhost:3001"
NEXTAUTH_SECRET="your-super-secret-jwt-key"
```

### 4. Initialize Database & Seed Demo Data
```bash
npx prisma db push
npx prisma generate
node prisma/seed.js
```

### 5. Run the Development Server
```bash
npm run dev
```

Open [http://localhost:3001](http://localhost:3001) in your browser.

---

## 📂 Project Architecture

```
codesoft_task1/
├── app/
│   ├── (dashboard)/
│   │   ├── admin/             # Major Admin & Principal Hub (Classes, Teachers, Students, Attendance, Fees, Exams)
│   │   ├── teacher/           # Teacher Academic Portal (Attendance, Results, Classes)
│   │   └── student/           # Student Academic Dashboard (Results, Fees, Profile)
│   ├── api/
│   │   ├── auth/              # NextAuth route handlers & JWT session callbacks
│   │   ├── principals/        # Central multi-principal management & read-only details
│   │   ├── attendance/        # Date-matrix attendance (Student & TeacherAttendance)
│   │   ├── students/          # Scoped student management & credentials
│   │   ├── teachers/          # Scoped faculty management
│   │   ├── classes/           # Academic divisions
│   │   ├── exams/             # Examinations & grades
│   │   └── fees/              # Digital fees & invoices
│   ├── login/                 # Responsive Auth Portal
│   ├── signup/                # Institutional Registration Portal
│   └── globals.css            # Global CSS Tokens & Glassmorphism Design System
├── components/
│   ├── layout/                # Sidebar, TopBar, and Navigation Wrappers
│   └── ui/                    # Reusable Modals, Tables, and Cards
├── prisma/
│   ├── schema.prisma          # Database schema (Multi-tenancy models)
│   └── seed.ts                # Realistic Indian academic dataset
├── middleware.ts              # Route protection & role-based redirection
└── package.json
```

---

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).

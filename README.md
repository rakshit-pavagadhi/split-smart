# 💸 SettleKar

> *Split expenses. Settle debts. Stay friends.*

A full-stack expense management and settlement platform with AI-powered receipt scanning, optimized debt calculation, real-time balance tracking, and integrated payments.

<p align="center">
  <img src="https://img.shields.io/badge/Java-21-orange?style=flat-square&logo=openjdk"/>
  <img src="https://img.shields.io/badge/Spring_Boot-4.0-brightgreen?style=flat-square&logo=springboot"/>
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react"/>
  <img src="https://img.shields.io/badge/PostgreSQL-15+-4169E1?style=flat-square&logo=postgresql"/>
  <img src="https://img.shields.io/badge/AWS-S3_+_RDS-FF9900?style=flat-square&logo=amazonaws"/>
  <img src="https://img.shields.io/badge/Razorpay-Payments-2563EB?style=flat-square"/>
</p>

<p align="center">
  <strong>Anirveda Breach Hackathon 2026</strong>
</p>

---

[Features](#-key-features) • [Architecture](#-architecture) • [User Flow](#-user-flow) • [Tech Stack](#-tech-stack) • [Quick Start](#-quick-start) • [Project Structure](#-project-structure) • [API Reference](#-api-reference) • [Database](#-database-schema) • [Security](#-security)

---

## 🚀 Key Features

### 💰 Expense Management
- Create groups (**Travel**, **Hostel**, **Event**, **Custom**) and invite members via join codes
- Add expenses with **equal**, **percentage**, or **custom exact** splits
- Real-time balance tracking with pairwise debt visualization
- **Min-cash-flow algorithm** — minimizes the total number of transactions needed to settle all debts within a group

### 💳 Payments & Settlement
- **Razorpay integration** for seamless in-app payments (UPI, cards, net banking)
- Full settlement creation, tracking, and confirmation workflow
- **Automated escalating reminders** — 3-day gentle nudge → 7-day formal email

### 🧾 AI-Powered Receipt Scanner
- Upload a receipt image → auto-extracts **description**, **amount**, and **category**
- Powered by **PaddleOCR** running on a dedicated FastAPI microservice
- Receipts stored on **AWS S3** with presigned URLs for secure, time-limited access

### 📊 Analytics & Reporting
- Category-wise spending breakdown (pie charts)
- Monthly spending trends (bar charts)
- Member contribution analysis
- Debt graph visualization with numbered nodes
- Export group ledger as **CSV**

### 🔒 Authentication & Security
- Email/password signup with email verification
- **Google OAuth2** login
- Password reset flow with cryptographically secure tokens
- **JWT-based** session management with auto-refresh

### 📧 Smart Notifications
- HTML-styled transactional email templates (verification, welcome, settlement confirmation)
- Escalating reminder system: gentle → formal → repeat
- Monthly hostel group expense summaries

---

## 🏗 Architecture

SettleKar follows a **3-tier microservice architecture**: a React SPA frontend, a Spring Boot REST backend, and an independent Python/FastAPI ML service for receipt scanning. All tiers communicate via REST APIs and share data through PostgreSQL (AWS RDS) and object storage (AWS S3).

```
┌──────────────────────────────────────────────────────────────────┐
│                    CLIENT (React SPA)                            │
│  React 19 • Vite 7 • Tailwind CSS 4 • Framer Motion • Recharts  │
│                                                                  │
│   AuthContext ──► Axios Interceptors ──► Protected Routes        │
│        │              │ (auto token refresh)                     │
│        ▼              ▼                                          │
│   Login/Signup    Dashboard ──► Groups ──► [Expenses, Balances,  │
│   (Google OAuth)                            Settlements,         │
│                                             Analytics]           │
└──────────┬───────────────────────────────────────────────────────┘
           │  REST API  (JWT Bearer)
           ▼
┌──────────────────────────────────────────────────────────────────┐
│               BACKEND (Spring Boot REST API)                     │
│  Java 21 • Spring Boot 4.0 • Spring Security • Spring Data JPA  │
│                                                                  │
│   Auth ──► Groups ──► Expenses ──► Balances ──► Settlements      │
│    │                                   │                         │
│    ▼                                   ▼                         │
│  Google OAuth2                Min-Cash-Flow Algorithm            │
│  JWT + Refresh                (Greedy O(n log n) optimizer)      │
│                                                                  │
│   Razorpay Payments       Analytics (Aggregation Queries)        │
│   Spring Mail (SMTP)      CSV Export                             │
│   Spring Security         Centralized Error Handling             │
└──────────┬──────────────────────────┬───────────────────────────┘
           │                          │
           ▼                          ▼
┌──────────────────┐     ┌─────────────────────────────────────────┐
│  ML MICROSERVICE │     │           DATABASE & STORAGE            │
│  (FastAPI/Python)│     │                                         │
│                  │     │  PostgreSQL 15+ (AWS RDS)               │
│  PaddleOCR       │     │  Users ── Groups ── Expenses            │
│  Receipt Parser  │     │                 └── Settlements          │
│  :8000           │     │                                         │
└──────────────────┘     │  AWS S3 (Receipt Images)                │
                         │  Presigned URLs • Time-limited access   │
                         └─────────────────────────────────────────┘
```

---

## 🔄 User Flow

```
Sign Up / Login
      │
      ├── New User? ──► Email Verification
      │
      ▼
  Dashboard
      │
      ▼
Create or Join Group
      │
      ▼
  Add Expense
      │
      ├── Has Receipt? ──► Upload Receipt (AI Auto-Extract)
      │                                │
      └── No Receipt ──► Manual Entry  │
                                       ▼
                              Choose Split Method
                         (Equal / Percentage / Custom)
                                       │
                                       ▼
                           View Balances & Debts
                         ┌──────────┼──────────┐
                         ▼          ▼          ▼
               Get Settlement   View        Export
                Suggestions   Analytics     CSV
                         │
                         ▼
                  Pay via Razorpay
                         │
                         ▼
               Settlement Confirmed
                         │
                         ▼
               Email Notification Sent
```

---

## 💻 Tech Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Backend** | Java 21, Spring Boot 4.0, Spring Security, Spring Data JPA | REST API, business logic, authentication |
| **Frontend** | React 19, Vite 7, Tailwind CSS 4, Framer Motion, Recharts | SPA with responsive UI and interactive charts |
| **ML Service** | Python 3.10+, FastAPI, PaddleOCR, PaddlePaddle | AI-powered receipt scanning microservice |
| **Database** | PostgreSQL 15+ (AWS RDS) | Persistent relational data storage |
| **Payments** | Razorpay Payment Gateway | UPI, cards, net banking |
| **Storage** | AWS S3 | Receipt image storage with presigned URLs |
| **Auth** | JWT + Google OAuth2 | Stateless authentication & social login |
| **Email** | Spring Mail (Gmail SMTP) | Transactional emails & reminders |

---

## ⚙️ Quick Start

### Prerequisites

| Tool | Version | Install |
| :--- | :--- | :--- |
| **Java** | 21 | `brew install openjdk@21` |
| **Node.js** | 18+ | `brew install node` |
| **Python** | 3.10+ | `brew install python` |
| **PostgreSQL** | 15+ | `brew install postgresql@17` |
| **Maven** | — | Bundled via `mvnw` wrapper |

### Setup

**1. Clone the repository**
```bash
git clone https://github.com/<your-username>/SettleKar.git
cd SettleKar
```

**2. Create the database**
```bash
brew services start postgresql@17
psql postgres -c "CREATE DATABASE settlekar_db;"
```

> Update credentials in `Backend/src/main/resources/application.properties` if needed.

**3. Start all services (one command)**
```bash
bash Documents/start-settlekar.sh
```

This launches:

| Service | URL |
| :--- | :--- |
| ML Service | `http://localhost:8000` |
| Backend API | `http://localhost:8080` |
| Frontend | `http://localhost:5173` |

Press `Ctrl+C` to stop all services.

<details>
<summary><strong>Or start each service individually</strong></summary>

```bash
# Terminal 1 — ML Service
cd ML/receipt-scanner
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Terminal 2 — Backend
cd Backend
./mvnw spring-boot:run

# Terminal 3 — Frontend
cd Frontend/settlekar-frontend
npm install
npm run dev
```

</details>

> [!TIP]
> For Google OAuth, obtain a Client ID from [Google Cloud Console](https://console.cloud.google.com/). Configure your `application.properties` with the Client ID and allowed origins.

> [!TIP]
> For email, use a Gmail App Password (not your account password). Enable 2FA on your Google account, then generate one at [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords).

---

## 📂 Project Structure

```
SettleKar/
├── Backend/                                  # Spring Boot REST API
│   └── src/main/java/com/settlekar/backend/
│       ├── config/                           # Security, CORS, Razorpay config
│       ├── controller/                       # REST controllers
│       ├── dto/                              # Request/Response DTOs
│       ├── entity/                           # JPA entities
│       ├── enums/                            # ExpenseCategory, SplitMethod, etc.
│       ├── repository/                       # Spring Data repositories
│       └── service/                          # Business logic
│
├── Frontend/                                 # React + Vite SPA
│   └── settlekar-frontend/
│       └── src/
│           ├── api/                          # Axios API clients
│           ├── components/                   # Reusable UI components
│           ├── contexts/                     # Auth context
│           ├── hooks/                        # Custom React hooks
│           ├── lib/                          # Utilities, formatters
│           └── pages/                        # Route-level page components
│
├── ML/                                       # Python ML microservice
│   └── receipt-scanner/
│       └── app/
│           ├── main.py                       # FastAPI app entry
│           ├── ocr_engine.py                 # PaddleOCR wrapper
│           └── receipt_parser.py             # Post-processing & extraction
│
└── Documents/
    ├── start-settlekar.sh                    # Start all 3 services
    └── cleanup_db.sh                         # Reset database
```

---

## 📡 API Reference

All endpoints are prefixed with `/api`. Protected routes require a `Bearer` token in the `Authorization` header.

<details>
<summary><strong>Auth</strong></summary>

| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :---: |
| `POST` | `/auth/signup` | Register a new user | ✗ |
| `POST` | `/auth/login` | Login with email/password | ✗ |
| `POST` | `/auth/google` | Login/register with Google OAuth | ✗ |
| `GET` | `/auth/verify-email` | Verify email via token | ✗ |
| `POST` | `/auth/forgot-password` | Request password reset email | ✗ |
| `POST` | `/auth/reset-password` | Reset password with token | ✗ |
| `POST` | `/auth/refresh-token` | Refresh expired access token | ✗ |
| `GET` | `/auth/profile` | Get current user profile | ✓ |

</details>

<details>
<summary><strong>Groups</strong></summary>

| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :---: |
| `POST` | `/groups` | Create a new group | ✓ |
| `GET` | `/groups` | List all user's groups | ✓ |
| `POST` | `/groups/join` | Join group via invite code | ✓ |
| `GET` | `/groups/:id` | Get group details | ✓ |
| `PUT` | `/groups/:id` | Update group info | ✓ |
| `DELETE` | `/groups/:id` | Delete a group | ✓ |
| `GET` | `/groups/:id/members` | List group members | ✓ |

</details>

<details>
<summary><strong>Expenses</strong></summary>

| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :---: |
| `POST` | `/groups/:id/expenses` | Add a new expense | ✓ |
| `GET` | `/groups/:id/expenses` | List group expenses | ✓ |
| `PUT` | `/groups/:id/expenses/:eid` | Update an expense | ✓ |
| `DELETE` | `/groups/:id/expenses/:eid` | Delete an expense | ✓ |

</details>

<details>
<summary><strong>Balances & Settlements</strong></summary>

| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :---: |
| `GET` | `/groups/:id/balances/summary` | Net balance for each member | ✓ |
| `GET` | `/groups/:id/balances/pairwise` | Pairwise debt breakdown | ✓ |
| `GET` | `/groups/:id/balances/graph` | Graph data (nodes + edges) | ✓ |
| `GET` | `/groups/:id/settlements/suggestions` | Min-cash-flow optimized suggestions | ✓ |
| `POST` | `/groups/:id/settlements` | Record a new settlement | ✓ |
| `GET` | `/groups/:id/settlements` | List all settlements | ✓ |
| `PUT` | `/groups/:id/settlements/:sid` | Update settlement status | ✓ |

</details>

<details>
<summary><strong>Payments</strong></summary>

| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :---: |
| `POST` | `/payments/create-order` | Create Razorpay order | ✓ |
| `POST` | `/payments/verify` | Verify Razorpay payment (HMAC SHA256) | ✓ |

</details>

<details>
<summary><strong>Receipt Scanner</strong></summary>

| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :---: |
| `POST` | `/receipts/scan` | Upload & parse receipt image | ✓ |

> Accepts `multipart/form-data` with a `receipt` field. Supported formats: JPEG, PNG, WebP. Max size: 10MB. Image is stored in AWS S3; the parsed result (description, amount, category) is returned in the response.

</details>

<details>
<summary><strong>Analytics & Export</strong></summary>

| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :---: |
| `GET` | `/groups/:id/analytics/category` | Category-wise spending breakdown | ✓ |
| `GET` | `/groups/:id/analytics/monthly` | Monthly spending trends | ✓ |
| `GET` | `/groups/:id/analytics/members` | Member contribution percentages | ✓ |
| `GET` | `/groups/:id/export/csv` | Download group ledger as CSV | ✓ |

</details>

---

## 🗄 Database Schema

```
USER
─────────────────────────────
id            UUID (PK)
name          VARCHAR
email         VARCHAR (unique)
password      VARCHAR (BCrypt)
avatar        VARCHAR
google_id     VARCHAR
is_verified   BOOLEAN
created_at    TIMESTAMP

GROUP
─────────────────────────────
id            UUID (PK)
name          VARCHAR
type          ENUM (Travel, Hostel, Event, Custom)
description   TEXT
invite_code   VARCHAR (unique)
created_by    UUID (FK → User)
is_active     BOOLEAN
created_at    TIMESTAMP

EXPENSE
─────────────────────────────
id            UUID (PK)
group_id      UUID (FK → Group)
description   VARCHAR
amount        DECIMAL
category      ENUM
paid_by       UUID (FK → User)
split_type    ENUM (Equal, Percentage, Custom)
date          DATE
created_by    UUID (FK → User)

EXPENSE_SPLIT  (embedded per expense)
─────────────────────────────
expense_id    UUID (FK → Expense)
user_id       UUID (FK → User)
amount        DECIMAL

SETTLEMENT
─────────────────────────────
id            UUID (PK)
group_id      UUID (FK → Group)
from_user     UUID (FK → User)
to_user       UUID (FK → User)
amount        DECIMAL
status        ENUM (pending → completed → rejected)
payment_method ENUM (razorpay, upi, cash, bank_transfer, other)
payment_id    VARCHAR
created_at    TIMESTAMP
completed_at  TIMESTAMP
```

### Key Relationships

| Relation | Type | Notes |
| :--- | :--- | :--- |
| User → Group | One-to-Many | A user can create multiple groups |
| Group ↔ User | Many-to-Many | Members table with `admin` / `member` roles |
| Group → Expense | One-to-Many | Each group tracks multiple expenses |
| Expense → Splits | One-to-Many | Per-user split amounts stored in `ExpenseSplit` |
| Group → Settlement | One-to-Many | Settlements track debt repayments between members |

---

## 🔐 Min-Cash-Flow Algorithm

The settlement optimization engine uses a **greedy algorithm** to minimize the total number of transactions required to settle all debts within a group. Rather than having every pair of users settle directly, this algorithm routes payments through a reduced set of optimized transfers.

```
Complexity: O(n log n) — dominated by the sorting step

Steps:
  1. Calculate net balance for each member (total paid − total owed)
  2. Separate members into two lists: creditors (+balance) and debtors (−balance)
  3. Sort both lists by absolute amount (descending)
  4. Greedy match: pair the largest debtor with the largest creditor
  5. Settle the minimum of the two amounts; carry forward any remainder
  6. Repeat until all balances reach zero
```

**Example — 4 members, 4 transactions reduced to 2:**

| Before Optimization | After Optimization |
| :--- | :--- |
| A → B: ₹500 | A → C: ₹300 |
| A → C: ₹300 | B → C: ₹200 |
| B → C: ₹200 | |
| B → A: ₹500 | **2 transactions instead of 4** |

---

## 🛡 Security

| Concern | Implementation |
| :--- | :--- |
| **Authentication** | JWT access tokens + Google OAuth2 |
| **Password Storage** | BCrypt hashing (never stored as plaintext) |
| **API Protection** | Spring Security filters on all protected endpoints |
| **Payment Verification** | Razorpay signature verification (HMAC SHA256) |
| **File Access** | AWS S3 presigned URLs (time-limited) |
| **Email Tokens** | Cryptographically random, single-use, time-expiring |
| **CORS** | Whitelisted origins only |

---

## 👥 Team

Built with 💜 by **Team Mission ImCodeable** for the **Anirveda Breach Hackathon 2026**.

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

<p align="center">
  <sub>If you found this helpful, consider giving it a ⭐</sub>
</p>
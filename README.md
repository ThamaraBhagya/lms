# EduFlow – Intelligent Learning Management System with AI-Powered Student Analytics
![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white) ![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB) ![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white) ![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white) ![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white) ![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white) ![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white) ![scikit-learn](https://img.shields.io/badge/scikit--learn-F7931E?style=for-the-badge&logo=scikit-learn&logoColor=white) ![Pandas](https://img.shields.io/badge/Pandas-150458?style=for-the-badge&logo=pandas&logoColor=white) ![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)

##  Project Overview

**EduFlow** is a smart Learning Management System (LMS) built to help educational institutions optimize student success and prevent dropouts. 

* **What it does:** Provides a complete suite of tools to manage courses, assignments, and user profiles (Students, Lecturers, Admins).
* **The AI Advantage:** Uses a built-in machine learning engine to analyze student performance in real-time, predicting if a student might drop out so teachers can intervene early.
* **Under the hood:** Built using a modern, fast, and scalable setup, splitting the workload across a React frontend, a Python (FastAPI) backend, and a dedicated AI engine—all neatly packaged in Docker.

---

##  Core Features

### 1. **User Management & Authentication**
- Multi-role authentication system (Student, Lecturer, Admin)
- JWT-based secure authentication with OAuth2 password flow
- Password hashing with bcrypt for high-security credential storage
- Role-based access control (RBAC) for granular permission management

### 2. **Course & Academic Management**
- Create, manage, and organize courses with unique course codes
- Lecturer assignment and course enrollment workflows
- Dynamic assignment creation with due dates and scoring
- Student submission tracking and grade management
- Comprehensive course discovery and enrollment interface

### 3. **AI-Powered Student Analytics** ⚡
- **Student Attrition Prediction Engine**: Random Forest ML model predicting student dropout risk vs. graduation likelihood
- Real-time predictions based on academic performance metrics
- Confidence scoring for each prediction outcome
- Comprehensive ML input tracking (grades, attendance, financial status)
- Actionable insights for early intervention strategies

### 4. **Interactive Dashboard**
- Role-specific dashboards (Students, Lecturers, Administrators)
- Real-time student performance visualization using React Charts
- Course management interface for educators
- Student profile management and analytics viewing
- Toast notifications for real-time feedback

### 5. **Data Persistence & ORM**
- PostgreSQL database with Prisma ORM for type-safe queries
- Automated migrations and schema management
- Relationships modeling for complex academic workflows

---

##  Architecture

### **Microservices Architecture Overview**

```
┌─────────────────────────────────────────────────────────┐
│          EDUFLOW MICROSERVICES PLATFORM                 │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌─────────────────┐  ┌──────────────────┐              │
│  │  Frontend       │  │  Core API        │              │
│  │  (Next.js)      │  │  (FastAPI)       │              │
│  │  Port: 3000     │  │  Port: 4000      │              │
│  └────────┬────────┘  └────────┬─────────┘              │
│           │                     │                        │
│           └─────────────────────┘                        │
│                     ▼                                     │
│           ┌──────────────────────┐                       │
│           │   PostgreSQL DB      │                       │
│           │   (Prisma ORM)       │                       │
│           └──────────────────────┘                       │
│                     ▲                                     │
│           ┌─────────┴──────────┐                         │
│           │                    │                         │
│  ┌────────▼────────┐  ┌────────▼────────┐               │
│  │  ML Engine      │  │  Background     │               │
│  │  (FastAPI)      │  │  Services       │               │
│  │  Port: 8000     │  │                 │               │
│  └─────────────────┘  └─────────────────┘               │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

### **Service Breakdown**

| Service | Purpose | Technology | Port |
|---------|---------|-----------|------|
| **Frontend** | User interface & client-side logic | Next.js 16, React 19, TypeScript | 3000 |
| **Core API** | Business logic & data management | FastAPI, Prisma, PostgreSQL | 4000 |
| **ML Engine** | Predictive analytics & ML inference | FastAPI, scikit-learn, Pandas | 8000 |

### **Data Flow**

1. **Frontend** captures user interactions and sends requests to the Core API
2. **Core API** validates requests, manages business logic, and persists data to PostgreSQL
3. **ML Engine** receives student profile data, processes features, and returns predictions
4. **Dashboard** displays real-time analytics and predictions to users

---

##  Technology Stack

### **Frontend Layer**
- **Next.js 16** - Production-grade React framework with SSR/SSG capabilities
- **React 19** - Modern component-based UI library
- **TypeScript** - Type-safe JavaScript development
- **Tailwind CSS 4** - Utility-first CSS framework for rapid UI development
- **Radix UI** - Accessible component primitives
- **Recharts** - React charting library for analytics visualization
- **ESLint** - Code quality and linting

### **Backend API Layer**
- **FastAPI** - Asynchronous Python web framework for high-performance APIs
- **Uvicorn** - ASGI server for running FastAPI applications
- **Prisma Client** - Type-safe ORM for database operations
- **Pydantic** - Data validation and serialization using Python type hints
- **Passlib + BCrypt** - Password hashing and verification
- **PyJWT** - JWT token generation and validation
- **HTTPX** - Async HTTP client for inter-service communication

### **Machine Learning Components**
- **scikit-learn** - Core ML library with Random Forest classifier
- **Pandas** - Data manipulation and feature engineering
- **Joblib** - Model serialization and persistence

### **Database & ORM**
- **PostgreSQL** - Relational database for structured academic data
- **Prisma ORM** - Next-generation database toolkit with type safety

### **Infrastructure & DevOps**
- **Docker** - Containerization for consistent deployment
- **Docker Compose** - Multi-container orchestration and local development
- **Git** - Version control

---

##  Machine Learning Integration

### **Student Attrition Prediction Model**

The ML engine employs a **Random Forest classifier** trained on historical student data to predict:
- **GRADUATE**: Probability the student will successfully complete the program
- **DROPOUT**: Risk assessment for student attrition

### **ML Input Features**
The model considers multiple academic and financial indicators:
- Previous qualification grades
- Semester enrollment and evaluation metrics
- Academic performance (grades by semester)
- Age at enrollment
- Tuition payment status
- Scholarship eligibility
- Number of approved courses
- Debtor status

### **ML Pipeline**
```
Raw Student Data
        ▼
Feature Engineering & Normalization (StandardScaler)
        ▼
Random Forest Prediction
        ▼
Confidence Scoring (%)
        ▼
Structured Output (Prediction + Confidence Scores)
```

### **Integration Architecture**
- Core API collects student profile data from PostgreSQL
- Sends serialized features to ML Engine via HTTP request
- ML Engine performs real-time inference with loaded model
- Returns predictions and confidence metrics
- Frontend displays actionable insights to stakeholders

---

##  Modern Technologies & Design Patterns

### **Advanced Patterns Implemented**

| Pattern | Implementation | Benefit |
|---------|---|---|
| **Microservices** | Independent services for frontend, API, ML | Scalability, independent deployment |
| **Async/Await** | FastAPI with async handlers | High concurrency, non-blocking I/O |
| **Type Safety** | TypeScript + Pydantic + Prisma | Early error detection, IDE support |
| **CORS** | Configured for cross-origin requests | Safe frontend-backend communication |
| **JWT Auth** | Token-based stateless authentication | Scalable, microservice-friendly auth |
| **ORM Abstraction** | Prisma for database access | SQL injection prevention, type safety |
| **ML Model Serving** | Dedicated FastAPI service | Scalable inference, model isolation |
| **Container Orchestration** | Docker Compose | Reproducible environments, easy scaling |

### **Modern React Practices**
- Server and Client Components (Next.js)
- Component composition patterns
- State management with React hooks
- Responsive UI with Tailwind CSS utilities
- Real-time UI feedback with Toast notifications



##  Security Features

- **Password Security**: Bcrypt hashing with salt for credential protection
- **Token-Based Auth**: JWT tokens with expiration for session management
- **CORS Protection**: Configurable cross-origin policies
- **Role-Based Access**: Endpoint-level authorization checks
- **Data Validation**: Pydantic models for input sanitization
- **ORM-Based Queries**: Prisma prevents SQL injection attacks



##  Getting Started

### **Prerequisites**
- Docker & Docker Compose
- Git
- Python 3.9+ (for local development)
- Node.js 18+ (for frontend development)

### **Installation & Setup**

```bash
# Clone the repository
git clone <repository-url>
cd LMS

# Build and run all services
docker-compose up --build

# Services will be available at:
# Frontend:  http://localhost:3000
# Core API:  http://localhost:4000
# ML Engine: http://localhost:8000
```

### **Local Development (Without Docker)**

#### Frontend
```bash
cd eduflow-frontend
npm install
npm run dev
# Visit http://localhost:3000
```

#### Core API
```bash
cd core_api
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 4000
# API docs at http://localhost:4000/docs
```

#### ML Engine
```bash
cd ml_core
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
# API docs at http://localhost:8000/docs
```

---

##  Performance Considerations

- **Async/Await**: FastAPI's async handlers handle multiple concurrent requests efficiently
- **Database Indexing**: Prisma schema optimized for frequent queries (email, course code)
- **Frontend Optimization**: Next.js code splitting and static generation reduce bundle size
- **ML Model Caching**: Joblib loads models once at startup for fast inference
- **Containerization**: Docker enables horizontal scaling and resource isolation

---

##  Development Workflow

### **Directory Structure**
```
LMS/
├── core_api/              # FastAPI backend service
│   ├── routers/           # Modular API endpoints
│   ├── prisma/            # Database schema & migrations
│   ├── security.py        # Auth utilities
│   ├── database.py        # DB connection management
│   ├── schemas.py         # Request/response models
│   └── main.py            # Application entry point
├── eduflow-frontend/      # Next.js frontend
│   ├── app/               # App router (Next.js 13+)
│   ├── components/        # React components
│   ├── lib/               # Utility functions
│   └── public/            # Static assets
├── ml_core/               # ML inference service
│   ├── main.py            # FastAPI ML server
│   ├── train_model.py     # Model training script
│   ├── test_model.py      # Model testing utilities
│   └── dataset.csv        # Training dataset
└── docker-compose.yml     # Service orchestration
```

---

##  Use Cases & Impact

1. **Early Intervention**: Institutions can identify at-risk students and provide targeted support
2. **Resource Optimization**: Data-driven decisions for curriculum and course planning
3. **Student Success**: Proactive measures based on predictive insights improve graduation rates
4. **Administrative Efficiency**: Streamlined course and assignment management
5. **Data-Driven Insights**: Interactive dashboards provide actionable analytics to stakeholders



##  Support & Documentation

For API documentation, visit:
- **Core API Swagger Docs**: `http://localhost:4000/docs`
- **ML Engine Swagger Docs**: `http://localhost:8000/docs`



**EduFlow** – Empowering Education with Intelligent Analytics

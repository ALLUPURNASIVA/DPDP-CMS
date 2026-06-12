# DPDP Consent Management Platform

An enterprise-grade, multi-tenant Consent Management System designed to help organizations comply with Digital Personal Data Protection (DPDP) regulations. This platform securely manages the entire lifecycle of user data consent, featuring role-based portals, immutable audit logging, and automated schema migrations.

## Key Features

The platform is divided into three distinct Role-Based Access Control (RBAC) portals:

*   ** Data Principal (General User) Portal:**
    *   View all connected Data Fiduciaries (companies).
    *   Grant, review, and withdraw consent for specific data processing purposes.
    *   Dynamic, tenant-isolated dashboards.
*   ** Data Fiduciary (Company Rep) Portal:**
    *   Securely validate a user's active consent status before processing personal data.
*   ** Platform Admin Portal:**
    *   Immutable Audit Ledger: Every grant, withdrawal, and validation is logged with a SHA-256 cryptographic hash.
    *   System configuration and cross-tenant monitoring.

## Technology Stack

**Frontend**
*   React 18 (via Vite)
*   Tailwind CSS (Utility-first styling)
*   React Router DOM (Client-side routing)
*   Auth0 (Identity & Authentication)
*   Axios & React Hot Toast

**Backend**
*   Java 17+
*   Spring Boot 3 (Web, Data JPA)
*   Spring Security (OAuth2 Resource Server)
*   Flyway (Database Migrations)
*   PostgreSQL (Relational Database)

## 🏗️ Architecture Highlights
*   **Multi-Tenancy:** Designed to support multiple client companies (`tenant_id`) within a single database instance securely.
*   **Cryptographic Auditing:** Built-in Java `MessageDigest` (SHA-256) hashes every user action to prevent tampering with compliance records.
*   **Stateless Security:** JWT-based authentication bridging Auth0 and Spring Security.

## 🚀 Getting Started

### Prerequisites
*   Node.js (v18+)
*   Java 17+ (JDK)
*   PostgreSQL (v14+)
*   An Auth0 Account

### Backend Setup (`/cms-backend`)
1. Create an empty PostgreSQL database named `cms`.
2. Update `src/main/resources/application.yml` with your database credentials and Auth0 Issuer URI.
3. Run the Spring Boot application. Flyway will automatically execute `V1__Initial_Schema.sql` to build the multi-tenant database tables.

### Frontend Setup (`/cms-frontend`)
1. Navigate to the frontend directory: `cd cms-frontend`
2. Install dependencies: `npm install`
3. Update `src/main.jsx` with your Auth0 Domain and Client ID.
4. Start the development server: `npm run dev`

## 🔒 Compliance & Security
This application is a demonstration of implementing technical safeguards for data privacy laws. It implements data minimization principles, explicit consent collection, and purpose-bound processing validation.

# Modern Inventory Management & POS System

A production-quality Point of Sale (POS) and Inventory Management SaaS platform built with the MERN/Prisma stack.

## Architecture & Tech Stack

**Frontend:**
- React 18 & Vite
- TypeScript
- Tailwind CSS (Linear/Stripe-inspired UI)
- Zustand (State Management)
- React Router v6

**Backend:**
- Node.js & Express.js
- TypeScript
- Prisma ORM (MongoDB Provider)
- JSON Web Tokens (JWT) & bcryptjs

## Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB (Local or Atlas URI)

### Backend Setup
1. `cd backend`
2. `npm install`
3. Ensure your MongoDB instance is running, and configure `.env` (copy from `.env.example` if it existed, default uses `mongodb://localhost:27017/pos_db`).
4. Run `npm run db:push` to sync the Prisma schema.
5. Run `npm run seed` to generate demo data and admin users.
6. Run `npm run dev` to start the API server on port 5000.

### Frontend Setup
1. `cd frontend`
2. `npm install`
3. `npm run dev` to start Vite on port 5173.

### Demo Credentials
- Admin: `admin@pos.io` / `admin123`
- Cashier: `cashier@pos.io` / `cashier123`

## Features

- Full POS checkout system with dynamic cart calculation
- Stock management and low-stock alerts
- Customer and supplier CRM
- Expense tracking and profit reporting
- Dark mode, fully responsive layout

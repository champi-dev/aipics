# AIPics

A social platform for AI-generated images. Users create images through text prompts using Leonardo AI, share them in a public feed, and engage with others' creations through likes.

## Tech Stack

### Backend
- Node.js with Express
- Apollo Server (GraphQL)
- PostgreSQL with Prisma ORM
- JWT authentication
- Leonardo AI for image generation

### Frontend
- React 18 with TypeScript
- Apollo Client
- React Router v6
- CSS Modules
- Vite

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Leonardo AI API key

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file from example:
   ```bash
   cp .env.example .env
   ```

4. Update `.env` with your configuration:
   - Set `DATABASE_URL` to your PostgreSQL connection string
   - Set `JWT_SECRET` to a secure random string
   - Set `LEONARDO_API_KEY` to your Leonardo AI API key

5. Generate Prisma client and push schema to database:
   ```bash
   npm run db:generate
   npm run db:push
   ```

6. Start the development server:
   ```bash
   npm run dev
   ```

The GraphQL API will be available at `http://localhost:4000/graphql`

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file from example:
   ```bash
   cp .env.example .env
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

The app will be available at `http://localhost:5173`

## Features

- User authentication (signup/login)
- Create AI-generated images from text prompts
- Public feed with infinite scroll
- Like/unlike posts
- User profiles
- Responsive design

## Project Structure

```
aipics/
├── backend/
│   ├── src/
│   │   ├── resolvers/     # GraphQL resolvers
│   │   ├── services/      # External services (Leonardo AI)
│   │   ├── utils/         # Validation, errors
│   │   ├── schema.ts      # GraphQL schema
│   │   └── index.ts       # Server entry point
│   └── prisma/
│       └── schema.prisma  # Database schema
│
├── frontend/
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom hooks
│   │   ├── graphql/       # GraphQL operations
│   │   ├── context/       # React context
│   │   ├── utils/         # Utilities
│   │   ├── styles/        # Global styles
│   │   └── App.tsx        # App entry point
│   └── index.html
│
└── README.md
```

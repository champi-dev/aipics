# AIPics - Complete Technical Specification

## Project Overview

**AIPics** is a social platform for AI-generated images. Users create images through text prompts using Leonardo AI, share them in a public feed, and engage with others' creations through likes. Think Twitter, but every post is an AI-generated image born from a text prompt.

---

## Tech Stack

### Frontend

- **React 18** with TypeScript
- **Apollo Client** for GraphQL state management
- **React Router v6** for navigation
- **CSS Modules** for styling
- **Vite** as build tool

### Backend

- **Node.js** with Express
- **Apollo Server** for GraphQL API
- **PostgreSQL** as database
- **Prisma** as ORM
- **Leonardo AI API** for image generation
- **JWT** for authentication
- **bcrypt** for password hashing

---

## Database Schema

### Users Table

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(30) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  avatar_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Posts Table

```sql
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  image_url VARCHAR(500) NOT NULL,
  leonardo_generation_id VARCHAR(100),
  status VARCHAR(20) DEFAULT 'completed', -- 'generating', 'completed', 'failed'
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Likes Table

```sql
CREATE TABLE likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, post_id)
);
```

### Indexes

```sql
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_likes_post_id ON likes(post_id);
CREATE INDEX idx_likes_user_id ON likes(user_id);
```

---

## Prisma Schema

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id           String   @id @default(uuid())
  username     String   @unique @db.VarChar(30)
  email        String   @unique @db.VarChar(255)
  passwordHash String   @map("password_hash") @db.VarChar(255)
  avatarUrl    String?  @map("avatar_url") @db.VarChar(500)
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")
  posts        Post[]
  likes        Like[]

  @@map("users")
}

model Post {
  id                   String   @id @default(uuid())
  userId               String   @map("user_id")
  prompt               String
  imageUrl             String   @map("image_url") @db.VarChar(500)
  leonardoGenerationId String?  @map("leonardo_generation_id") @db.VarChar(100)
  status               String   @default("completed") @db.VarChar(20)
  likesCount           Int      @default(0) @map("likes_count")
  createdAt            DateTime @default(now()) @map("created_at")
  user                 User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  likes                Like[]

  @@index([userId])
  @@index([createdAt(sort: Desc)])
  @@map("posts")
}

model Like {
  id        String   @id @default(uuid())
  userId    String   @map("user_id")
  postId    String   @map("post_id")
  createdAt DateTime @default(now()) @map("created_at")
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  post      Post     @relation(fields: [postId], references: [id], onDelete: Cascade)

  @@unique([userId, postId])
  @@index([postId])
  @@index([userId])
  @@map("likes")
}
```

---

## GraphQL Schema

```graphql
type User {
  id: ID!
  username: String!
  email: String!
  avatarUrl: String
  createdAt: String!
  posts: [Post!]!
  postsCount: Int!
}

type Post {
  id: ID!
  prompt: String!
  imageUrl: String!
  status: PostStatus!
  likesCount: Int!
  createdAt: String!
  user: User!
  isLikedByMe: Boolean!
}

enum PostStatus {
  GENERATING
  COMPLETED
  FAILED
}

type AuthPayload {
  token: String!
  user: User!
}

type PostConnection {
  posts: [Post!]!
  hasMore: Boolean!
  nextCursor: String
}

type Query {
  # Auth
  me: User

  # Feed
  feed(cursor: String, limit: Int): PostConnection!

  # User profile
  user(username: String!): User
  userPosts(username: String!, cursor: String, limit: Int): PostConnection!

  # Single post
  post(id: ID!): Post

  # Generation status polling
  generationStatus(postId: ID!): Post
}

type Mutation {
  # Auth
  signup(input: SignupInput!): AuthPayload!
  login(input: LoginInput!): AuthPayload!

  # Posts
  createPost(prompt: String!): Post!
  deletePost(id: ID!): Boolean!

  # Likes
  likePost(postId: ID!): Post!
  unlikePost(postId: ID!): Post!
}

input SignupInput {
  username: String!
  email: String!
  password: String!
}

input LoginInput {
  email: String!
  password: String!
}
```

---

## Leonardo AI Integration

### Service Module

```typescript
// src/services/leonardo.ts

interface LeonardoGenerationResponse {
  sdGenerationJob: {
    generationId: string;
  };
}

interface LeonardoGenerationResult {
  generations_by_pk: {
    id: string;
    status: "PENDING" | "COMPLETE" | "FAILED";
    generated_images: Array<{
      id: string;
      url: string;
    }>;
  };
}

export class LeonardoService {
  private apiKey: string;
  private baseUrl = "https://cloud.leonardo.ai/api/rest/v1";
  private modelId: string;

  constructor() {
    this.apiKey = process.env.LEONARDO_API_KEY!;
    this.modelId =
      process.env.LEONARDO_MODEL_ID || "ac614f96-1082-45bf-be9d-757f2d31c174"; // DreamShaper v7
  }

  async createGeneration(prompt: string): Promise<string> {
    const response = await fetch(`${this.baseUrl}/generations`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        modelId: this.modelId,
        width: 512,
        height: 512,
        num_images: 1,
        guidance_scale: 7,
        public: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Leonardo API error: ${response.statusText}`);
    }

    const data: LeonardoGenerationResponse = await response.json();
    return data.sdGenerationJob.generationId;
  }

  async getGenerationResult(generationId: string): Promise<{
    status: "PENDING" | "COMPLETE" | "FAILED";
    imageUrl?: string;
  }> {
    const response = await fetch(
      `${this.baseUrl}/generations/${generationId}`,
      {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Leonardo API error: ${response.statusText}`);
    }

    const data: LeonardoGenerationResult = await response.json();
    const generation = data.generations_by_pk;

    return {
      status: generation.status,
      imageUrl: generation.generated_images?.[0]?.url,
    };
  }

  async pollForCompletion(
    generationId: string,
    maxAttempts = 30
  ): Promise<string> {
    for (let i = 0; i < maxAttempts; i++) {
      const result = await this.getGenerationResult(generationId);

      if (result.status === "COMPLETE" && result.imageUrl) {
        return result.imageUrl;
      }

      if (result.status === "FAILED") {
        throw new Error("Image generation failed");
      }

      await new Promise((resolve) => setTimeout(resolve, 2000)); // Poll every 2 seconds
    }

    throw new Error("Generation timed out");
  }
}
```

---

## GraphQL Resolvers

### Auth Resolvers

```typescript
// src/resolvers/auth.ts

import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const authResolvers = {
  Mutation: {
    signup: async (_, { input }, { prisma }) => {
      const { username, email, password } = input;

      // Validate username format
      if (!/^[a-zA-Z0-9_]{3,30}$/.test(username)) {
        throw new Error(
          "Username must be 3-30 characters, alphanumeric and underscores only"
        );
      }

      // Check existing user
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [{ email }, { username }],
        },
      });

      if (existingUser) {
        throw new Error("Email or username already taken");
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 12);

      // Create user
      const user = await prisma.user.create({
        data: {
          username,
          email,
          passwordHash,
        },
      });

      // Generate token
      const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, {
        expiresIn: "7d",
      });

      return { token, user };
    },

    login: async (_, { input }, { prisma }) => {
      const { email, password } = input;

      const user = await prisma.user.findUnique({ where: { email } });

      if (!user) {
        throw new Error("Invalid credentials");
      }

      const valid = await bcrypt.compare(password, user.passwordHash);

      if (!valid) {
        throw new Error("Invalid credentials");
      }

      const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, {
        expiresIn: "7d",
      });

      return { token, user };
    },
  },

  Query: {
    me: async (_, __, { prisma, userId }) => {
      if (!userId) return null;
      return prisma.user.findUnique({ where: { id: userId } });
    },
  },
};
```

### Post Resolvers

```typescript
// src/resolvers/post.ts

import { LeonardoService } from "../services/leonardo";

const leonardo = new LeonardoService();

export const postResolvers = {
  Query: {
    feed: async (_, { cursor, limit = 20 }, { prisma, userId }) => {
      const take = Math.min(limit, 50);

      const posts = await prisma.post.findMany({
        where: {
          status: "completed",
          ...(cursor && { createdAt: { lt: new Date(cursor) } }),
        },
        orderBy: { createdAt: "desc" },
        take: take + 1,
        include: { user: true },
      });

      const hasMore = posts.length > take;
      const returnPosts = hasMore ? posts.slice(0, -1) : posts;

      return {
        posts: returnPosts,
        hasMore,
        nextCursor:
          returnPosts.length > 0
            ? returnPosts[returnPosts.length - 1].createdAt.toISOString()
            : null,
      };
    },

    post: async (_, { id }, { prisma }) => {
      return prisma.post.findUnique({
        where: { id },
        include: { user: true },
      });
    },

    generationStatus: async (_, { postId }, { prisma }) => {
      return prisma.post.findUnique({
        where: { id: postId },
        include: { user: true },
      });
    },

    userPosts: async (_, { username, cursor, limit = 20 }, { prisma }) => {
      const user = await prisma.user.findUnique({ where: { username } });
      if (!user) throw new Error("User not found");

      const take = Math.min(limit, 50);

      const posts = await prisma.post.findMany({
        where: {
          userId: user.id,
          status: "completed",
          ...(cursor && { createdAt: { lt: new Date(cursor) } }),
        },
        orderBy: { createdAt: "desc" },
        take: take + 1,
        include: { user: true },
      });

      const hasMore = posts.length > take;
      const returnPosts = hasMore ? posts.slice(0, -1) : posts;

      return {
        posts: returnPosts,
        hasMore,
        nextCursor:
          returnPosts.length > 0
            ? returnPosts[returnPosts.length - 1].createdAt.toISOString()
            : null,
      };
    },
  },

  Mutation: {
    createPost: async (_, { prompt }, { prisma, userId }) => {
      if (!userId) throw new Error("Authentication required");

      // Validate prompt
      if (prompt.trim().length < 3 || prompt.length > 1000) {
        throw new Error("Prompt must be between 3 and 1000 characters");
      }

      // Create post in generating state
      const post = await prisma.post.create({
        data: {
          userId,
          prompt: prompt.trim(),
          imageUrl: "",
          status: "generating",
        },
        include: { user: true },
      });

      // Start generation asynchronously
      (async () => {
        try {
          const generationId = await leonardo.createGeneration(prompt);

          await prisma.post.update({
            where: { id: post.id },
            data: { leonardoGenerationId: generationId },
          });

          const imageUrl = await leonardo.pollForCompletion(generationId);

          await prisma.post.update({
            where: { id: post.id },
            data: {
              imageUrl,
              status: "completed",
            },
          });
        } catch (error) {
          await prisma.post.update({
            where: { id: post.id },
            data: { status: "failed" },
          });
        }
      })();

      return post;
    },

    deletePost: async (_, { id }, { prisma, userId }) => {
      if (!userId) throw new Error("Authentication required");

      const post = await prisma.post.findUnique({ where: { id } });

      if (!post || post.userId !== userId) {
        throw new Error("Post not found or unauthorized");
      }

      await prisma.post.delete({ where: { id } });
      return true;
    },
  },

  Post: {
    isLikedByMe: async (post, _, { prisma, userId }) => {
      if (!userId) return false;

      const like = await prisma.like.findUnique({
        where: {
          userId_postId: { userId, postId: post.id },
        },
      });

      return !!like;
    },
  },
};
```

### Like Resolvers

```typescript
// src/resolvers/like.ts

export const likeResolvers = {
  Mutation: {
    likePost: async (_, { postId }, { prisma, userId }) => {
      if (!userId) throw new Error("Authentication required");

      const post = await prisma.post.findUnique({ where: { id: postId } });
      if (!post) throw new Error("Post not found");

      // Create like (will fail if already exists due to unique constraint)
      try {
        await prisma.like.create({
          data: { userId, postId },
        });

        // Increment likes count
        return prisma.post.update({
          where: { id: postId },
          data: { likesCount: { increment: 1 } },
          include: { user: true },
        });
      } catch (error) {
        // Already liked, return current state
        return prisma.post.findUnique({
          where: { id: postId },
          include: { user: true },
        });
      }
    },

    unlikePost: async (_, { postId }, { prisma, userId }) => {
      if (!userId) throw new Error("Authentication required");

      const like = await prisma.like.findUnique({
        where: {
          userId_postId: { userId, postId },
        },
      });

      if (like) {
        await prisma.like.delete({
          where: { id: like.id },
        });

        return prisma.post.update({
          where: { id: postId },
          data: { likesCount: { decrement: 1 } },
          include: { user: true },
        });
      }

      return prisma.post.findUnique({
        where: { id: postId },
        include: { user: true },
      });
    },
  },
};
```

---

## Frontend Architecture

### Project Structure

```
src/
├── components/
│   ├── common/
│   │   ├── Button/
│   │   │   ├── Button.tsx
│   │   │   └── Button.module.css
│   │   ├── Input/
│   │   ├── Avatar/
│   │   ├── Spinner/
│   │   └── Modal/
│   ├── layout/
│   │   ├── Header/
│   │   ├── Sidebar/
│   │   └── Layout/
│   ├── auth/
│   │   ├── LoginForm/
│   │   ├── SignupForm/
│   │   └── AuthModal/
│   ├── post/
│   │   ├── PostCard/
│   │   ├── PostGrid/
│   │   ├── CreatePost/
│   │   ├── GeneratingPost/
│   │   └── LikeButton/
│   └── feed/
│       └── Feed/
├── pages/
│   ├── Home/
│   ├── Profile/
│   └── PostDetail/
├── hooks/
│   ├── useAuth.ts
│   ├── useCreatePost.ts
│   └── useFeed.ts
├── graphql/
│   ├── queries.ts
│   ├── mutations.ts
│   └── fragments.ts
├── context/
│   └── AuthContext.tsx
├── utils/
│   ├── formatDate.ts
│   └── apolloClient.ts
├── styles/
│   ├── variables.css
│   ├── reset.css
│   └── global.css
├── App.tsx
└── main.tsx
```

---

## UI/UX Specifications

### Design System

#### Colors

```css
:root {
  /* Primary */
  --color-primary: #6366f1;
  --color-primary-hover: #4f46e5;
  --color-primary-light: #e0e7ff;

  /* Backgrounds */
  --color-bg-primary: #0a0a0b;
  --color-bg-secondary: #141416;
  --color-bg-tertiary: #1c1c1f;
  --color-bg-hover: #252529;

  /* Text */
  --color-text-primary: #fafafa;
  --color-text-secondary: #a1a1aa;
  --color-text-tertiary: #71717a;

  /* Accents */
  --color-like: #ef4444;
  --color-like-hover: #dc2626;
  --color-success: #22c55e;
  --color-error: #ef4444;

  /* Borders */
  --color-border: #27272a;
  --color-border-hover: #3f3f46;

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.4);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.4);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.4);
}
```

#### Typography

```css
:root {
  --font-family: "Inter", -apple-system, BlinkMacSystemFont, sans-serif;

  --font-size-xs: 0.75rem; /* 12px */
  --font-size-sm: 0.875rem; /* 14px */
  --font-size-base: 1rem; /* 16px */
  --font-size-lg: 1.125rem; /* 18px */
  --font-size-xl: 1.25rem; /* 20px */
  --font-size-2xl: 1.5rem; /* 24px */
  --font-size-3xl: 2rem; /* 32px */

  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;

  --line-height-tight: 1.25;
  --line-height-normal: 1.5;
  --line-height-relaxed: 1.75;
}
```

#### Spacing

```css
:root {
  --spacing-1: 0.25rem; /* 4px */
  --spacing-2: 0.5rem; /* 8px */
  --spacing-3: 0.75rem; /* 12px */
  --spacing-4: 1rem; /* 16px */
  --spacing-5: 1.25rem; /* 20px */
  --spacing-6: 1.5rem; /* 24px */
  --spacing-8: 2rem; /* 32px */
  --spacing-10: 2.5rem; /* 40px */
  --spacing-12: 3rem; /* 48px */

  --radius-sm: 0.375rem; /* 6px */
  --radius-md: 0.5rem; /* 8px */
  --radius-lg: 0.75rem; /* 12px */
  --radius-xl: 1rem; /* 16px */
  --radius-full: 9999px;
}
```

---

### Page Layouts

#### 1. Home Page (Feed)

```
┌─────────────────────────────────────────────────────────────────┐
│  HEADER                                                         │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ [Logo: AIPics]              [Create] [@username ▼]          ││
│  └─────────────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  CREATE POST BAR                                            ││
│  │  ┌─────────────────────────────────────────────────────────┐││
│  │  │ "Describe your image..."                          [⏎]  │││
│  │  └─────────────────────────────────────────────────────────┘││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  POST GRID (Masonry Layout, 3 columns on desktop)          ││
│  │                                                             ││
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐                     ││
│  │  │ [Image] │  │ [Image] │  │ [Image] │                     ││
│  │  │         │  │         │  │         │                     ││
│  │  │ prompt  │  │ prompt  │  │ prompt  │                     ││
│  │  │ @user   │  │ @user   │  │ @user   │                     ││
│  │  │ ♡ 123   │  │ ♥ 456   │  │ ♡ 789   │                     ││
│  │  └─────────┘  └─────────┘  └─────────┘                     ││
│  │                                                             ││
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐                     ││
│  │  │ [Image] │  │ [GENRTN]│  │ [Image] │                     ││
│  │  │         │  │ ░░░░░░░ │  │         │                     ││
│  │  │ prompt  │  │ prompt  │  │ prompt  │                     ││
│  │  │ @user   │  │ @me     │  │ @user   │                     ││
│  │  │ ♡ 42    │  │ ···     │  │ ♥ 88    │                     ││
│  │  └─────────┘  └─────────┘  └─────────┘                     ││
│  │                                                             ││
│  │             [Load More] (or infinite scroll)                ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### 2. Auth Modal

```
┌──────────────────────────────────────┐
│                              [✕]     │
│                                      │
│         Welcome to AIPics            │
│                                      │
│  ┌──────────────────────────────┐    │
│  │ Email                        │    │
│  └──────────────────────────────┘    │
│                                      │
│  ┌──────────────────────────────┐    │
│  │ Password                     │    │
│  └──────────────────────────────┘    │
│                                      │
│  ┌──────────────────────────────┐    │
│  │         Log In               │    │
│  └──────────────────────────────┘    │
│                                      │
│  ─────────── or ───────────          │
│                                      │
│  Don't have an account? Sign up      │
│                                      │
└──────────────────────────────────────┘
```

#### 3. Profile Page

```
┌─────────────────────────────────────────────────────────────────┐
│  HEADER                                                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  PROFILE HEADER                                             ││
│  │                                                             ││
│  │  ┌────────┐                                                 ││
│  │  │ Avatar │  @username                                      ││
│  │  │  (lg)  │  Joined Dec 2024                                ││
│  │  └────────┘  142 creations                                  ││
│  │                                                             ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  USER'S POSTS GRID                                          ││
│  │  (Same masonry layout as feed)                              ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

### Component Specifications

#### PostCard Component

```
┌───────────────────────────────────┐
│                                   │
│         [AI Generated Image]      │
│                                   │
│         (hover: slight scale,     │
│          shows overlay)           │
│                                   │
├───────────────────────────────────┤
│                                   │
│ "A cyberpunk cat sitting on a     │
│  neon-lit rooftop at night..."    │
│                                   │
│ ┌──────┐                          │
│ │ Avtr │ @username · 2h ago       │
│ └──────┘                          │
│                                   │
│ ♡ 1,234                           │
│                                   │
└───────────────────────────────────┘

States:
- Default: As shown
- Hover: Image scales 1.02, shows subtle overlay
- Liked: Heart filled (♥), red color
- Loading: Skeleton placeholder
```

#### GeneratingPost Component (while image is being created)

```
┌───────────────────────────────────┐
│                                   │
│     ┌─────────────────────┐       │
│     │                     │       │
│     │    ◌ Generating...  │       │
│     │                     │       │
│     │   ░░░░░░░░░░░░░░░   │       │
│     │   (progress pulse)  │       │
│     │                     │       │
│     └─────────────────────┘       │
│                                   │
├───────────────────────────────────┤
│                                   │
│ "Your prompt text here..."        │
│                                   │
│ ┌──────┐                          │
│ │ You  │ @yourname · Just now     │
│ └──────┘                          │
│                                   │
└───────────────────────────────────┘

Animation:
- Pulsing gradient background
- Rotating spinner icon
- Progress bar (indeterminate)
```

#### CreatePost Component

```
┌─────────────────────────────────────────────────────────────────┐
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │                                                             │ │
│ │  Describe your image...                                     │ │
│ │                                                             │ │
│ │                                            [⏎] or [Create]  │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ Tip: Be descriptive! Include style, mood, colors, and details. │
└─────────────────────────────────────────────────────────────────┘

States:
- Empty: Placeholder text, button disabled
- Typing: Character count shown (e.g., "234/1000")
- Valid: Button enabled, primary color
- Submitting: Button shows spinner, input disabled
- Error: Red border, error message below
```

#### LikeButton Component

```
States:

Unliked:          Liked:            Animating:
┌─────────┐       ┌─────────┐       ┌─────────┐
│  ♡ 123  │       │  ♥ 124  │       │  ♥ 124  │
└─────────┘       └─────────┘       └─────────┘
(gray)            (red, filled)     (scale bounce)

Interactions:
- Click: Toggle like state
- Optimistic update: Immediate visual feedback
- Animation: Heart scales up then down (0.8 → 1.2 → 1.0)
- Hover: Slight color change
```

---

### Responsive Breakpoints

```css
/* Mobile first approach */

/* Small phones */
@media (max-width: 374px) {
  /* Single column grid */
  /* Smaller text sizes */
}

/* Phones */
@media (min-width: 375px) {
  /* Single column, slightly larger */
}

/* Large phones / Small tablets */
@media (min-width: 640px) {
  /* 2 column grid */
}

/* Tablets */
@media (min-width: 768px) {
  /* 2 column grid */
  /* Sidebar visible */
}

/* Small desktops */
@media (min-width: 1024px) {
  /* 3 column grid */
  /* Full layout */
}

/* Large desktops */
@media (min-width: 1280px) {
  /* 4 column grid option */
  /* Max width container */
}
```

---

### Interaction States & Animations

#### Loading States

1. **Initial Page Load**: Full-screen skeleton with pulsing cards
2. **Infinite Scroll**: Spinner at bottom, skeleton cards appearing
3. **Image Generation**: Animated gradient background with spinner
4. **Button Loading**: Spinner replaces text, button disabled

#### Transitions

```css
/* Default transition for interactive elements */
.interactive {
  transition: all 0.2s ease-out;
}

/* Image hover */
.postImage {
  transition: transform 0.3s ease-out;
}
.postImage:hover {
  transform: scale(1.02);
}

/* Like animation */
@keyframes likeHeart {
  0% {
    transform: scale(1);
  }
  25% {
    transform: scale(1.2);
  }
  50% {
    transform: scale(0.95);
  }
  100% {
    transform: scale(1);
  }
}

/* Skeleton pulse */
@keyframes pulse {
  0%,
  100% {
    opacity: 0.4;
  }
  50% {
    opacity: 0.8;
  }
}

/* Generation progress */
@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}
```

#### Error States

```
┌─────────────────────────────────────┐
│  ⚠️                                  │
│                                     │
│  Something went wrong               │
│  Could not load the feed            │
│                                     │
│  [Try Again]                        │
│                                     │
└─────────────────────────────────────┘
```

#### Empty States

```
Feed empty (new user):
┌─────────────────────────────────────┐
│                                     │
│           🎨                        │
│                                     │
│     Welcome to AIPics!              │
│                                     │
│  Create your first AI image by     │
│  typing a prompt above.             │
│                                     │
│  [Get Started]                      │
│                                     │
└─────────────────────────────────────┘

Profile empty (no posts):
┌─────────────────────────────────────┐
│                                     │
│           🖼️                        │
│                                     │
│     No creations yet                │
│                                     │
│  This user hasn't created any       │
│  images yet.                        │
│                                     │
└─────────────────────────────────────┘
```

---

## API Endpoints Structure

### Backend Server Setup

```typescript
// src/index.ts

import express from "express";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { PrismaClient } from "@prisma/client";
import cors from "cors";
import jwt from "jsonwebtoken";
import { typeDefs } from "./schema";
import { resolvers } from "./resolvers";

const prisma = new PrismaClient();

async function startServer() {
  const app = express();

  const server = new ApolloServer({
    typeDefs,
    resolvers,
  });

  await server.start();

  app.use(
    "/graphql",
    cors({
      origin: process.env.FRONTEND_URL || "http://localhost:5173",
      credentials: true,
    }),
    express.json(),
    expressMiddleware(server, {
      context: async ({ req }) => {
        const token = req.headers.authorization?.replace("Bearer ", "");
        let userId = null;

        if (token) {
          try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
              userId: string;
            };
            userId = decoded.userId;
          } catch (e) {
            // Invalid token, userId remains null
          }
        }

        return { prisma, userId };
      },
    })
  );

  const PORT = process.env.PORT || 4000;

  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/graphql`);
  });
}

startServer();
```

---

## Environment Variables

### Backend (.env)

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/aipics?schema=public"

# Auth
JWT_SECRET="your-super-secret-jwt-key-change-in-production"

# Leonardo AI
LEONARDO_API_KEY="your-leonardo-api-key"
LEONARDO_MODEL_ID="ac614f96-1082-45bf-be9d-757f2d31c174"

# Server
PORT=4000
FRONTEND_URL="http://localhost:5173"
NODE_ENV="development"
```

### Frontend (.env)

```env
VITE_API_URL="http://localhost:4000/graphql"
VITE_APP_NAME="AIPics"
```

---

## Frontend GraphQL Operations

### Queries

```typescript
// src/graphql/queries.ts

import { gql } from "@apollo/client";
import { POST_FRAGMENT, USER_FRAGMENT } from "./fragments";

export const GET_FEED = gql`
  ${POST_FRAGMENT}
  query GetFeed($cursor: String, $limit: Int) {
    feed(cursor: $cursor, limit: $limit) {
      posts {
        ...PostFragment
      }
      hasMore
      nextCursor
    }
  }
`;

export const GET_ME = gql`
  ${USER_FRAGMENT}
  query GetMe {
    me {
      ...UserFragment
    }
  }
`;

export const GET_USER = gql`
  ${USER_FRAGMENT}
  query GetUser($username: String!) {
    user(username: $username) {
      ...UserFragment
      postsCount
    }
  }
`;

export const GET_USER_POSTS = gql`
  ${POST_FRAGMENT}
  query GetUserPosts($username: String!, $cursor: String, $limit: Int) {
    userPosts(username: $username, cursor: $cursor, limit: $limit) {
      posts {
        ...PostFragment
      }
      hasMore
      nextCursor
    }
  }
`;

export const GET_GENERATION_STATUS = gql`
  ${POST_FRAGMENT}
  query GetGenerationStatus($postId: ID!) {
    generationStatus(postId: $postId) {
      ...PostFragment
    }
  }
`;
```

### Mutations

```typescript
// src/graphql/mutations.ts

import { gql } from "@apollo/client";
import { POST_FRAGMENT, USER_FRAGMENT } from "./fragments";

export const LOGIN = gql`
  ${USER_FRAGMENT}
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      token
      user {
        ...UserFragment
      }
    }
  }
`;

export const SIGNUP = gql`
  ${USER_FRAGMENT}
  mutation Signup($input: SignupInput!) {
    signup(input: $input) {
      token
      user {
        ...UserFragment
      }
    }
  }
`;

export const CREATE_POST = gql`
  ${POST_FRAGMENT}
  mutation CreatePost($prompt: String!) {
    createPost(prompt: $prompt) {
      ...PostFragment
    }
  }
`;

export const LIKE_POST = gql`
  mutation LikePost($postId: ID!) {
    likePost(postId: $postId) {
      id
      likesCount
      isLikedByMe
    }
  }
`;

export const UNLIKE_POST = gql`
  mutation UnlikePost($postId: ID!) {
    unlikePost(postId: $postId) {
      id
      likesCount
      isLikedByMe
    }
  }
`;

export const DELETE_POST = gql`
  mutation DeletePost($id: ID!) {
    deletePost(id: $id)
  }
`;
```

### Fragments

```typescript
// src/graphql/fragments.ts

import { gql } from "@apollo/client";

export const USER_FRAGMENT = gql`
  fragment UserFragment on User {
    id
    username
    email
    avatarUrl
    createdAt
  }
`;

export const POST_FRAGMENT = gql`
  fragment PostFragment on Post {
    id
    prompt
    imageUrl
    status
    likesCount
    isLikedByMe
    createdAt
    user {
      id
      username
      avatarUrl
    }
  }
`;
```

---

## Custom Hooks

### useAuth Hook

```typescript
// src/hooks/useAuth.ts

import { useContext, useCallback } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { AuthContext } from "../context/AuthContext";
import { LOGIN, SIGNUP } from "../graphql/mutations";
import { GET_ME } from "../graphql/queries";

export function useAuth() {
  const context = useContext(AuthContext);

  const { data, loading: meLoading } = useQuery(GET_ME, {
    skip: !context.token,
  });

  const [loginMutation, { loading: loginLoading }] = useMutation(LOGIN);
  const [signupMutation, { loading: signupLoading }] = useMutation(SIGNUP);

  const login = useCallback(
    async (email: string, password: string) => {
      const { data } = await loginMutation({
        variables: { input: { email, password } },
      });
      context.setToken(data.login.token);
      return data.login.user;
    },
    [loginMutation, context]
  );

  const signup = useCallback(
    async (username: string, email: string, password: string) => {
      const { data } = await signupMutation({
        variables: { input: { username, email, password } },
      });
      context.setToken(data.signup.token);
      return data.signup.user;
    },
    [signupMutation, context]
  );

  const logout = useCallback(() => {
    context.setToken(null);
  }, [context]);

  return {
    user: data?.me ?? null,
    isAuthenticated: !!context.token,
    isLoading: meLoading,
    login,
    signup,
    logout,
    loginLoading,
    signupLoading,
  };
}
```

### useCreatePost Hook

```typescript
// src/hooks/useCreatePost.ts

import { useState, useCallback } from "react";
import { useMutation, useApolloClient } from "@apollo/client";
import { CREATE_POST } from "../graphql/mutations";
import { GET_GENERATION_STATUS, GET_FEED } from "../graphql/queries";

export function useCreatePost() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingPost, setGeneratingPost] = useState(null);
  const client = useApolloClient();

  const [createPostMutation] = useMutation(CREATE_POST);

  const createPost = useCallback(
    async (prompt: string) => {
      setIsGenerating(true);

      try {
        const { data } = await createPostMutation({
          variables: { prompt },
        });

        const post = data.createPost;
        setGeneratingPost(post);

        // Poll for completion
        const pollInterval = setInterval(async () => {
          const { data: statusData } = await client.query({
            query: GET_GENERATION_STATUS,
            variables: { postId: post.id },
            fetchPolicy: "network-only",
          });

          const updatedPost = statusData.generationStatus;

          if (updatedPost.status === "completed") {
            clearInterval(pollInterval);
            setIsGenerating(false);
            setGeneratingPost(null);

            // Refetch feed to show new post
            client.refetchQueries({ include: [GET_FEED] });
          } else if (updatedPost.status === "failed") {
            clearInterval(pollInterval);
            setIsGenerating(false);
            setGeneratingPost(null);
            throw new Error("Image generation failed");
          } else {
            setGeneratingPost(updatedPost);
          }
        }, 2000);

        // Cleanup after 2 minutes max
        setTimeout(() => {
          clearInterval(pollInterval);
          setIsGenerating(false);
        }, 120000);
      } catch (error) {
        setIsGenerating(false);
        setGeneratingPost(null);
        throw error;
      }
    },
    [createPostMutation, client]
  );

  return {
    createPost,
    isGenerating,
    generatingPost,
  };
}
```

### useFeed Hook

```typescript
// src/hooks/useFeed.ts

import { useCallback } from "react";
import { useQuery } from "@apollo/client";
import { GET_FEED } from "../graphql/queries";

export function useFeed(limit = 20) {
  const { data, loading, error, fetchMore } = useQuery(GET_FEED, {
    variables: { limit },
    notifyOnNetworkStatusChange: true,
  });

  const loadMore = useCallback(() => {
    if (!data?.feed.hasMore) return;

    fetchMore({
      variables: {
        cursor: data.feed.nextCursor,
        limit,
      },
      updateQuery: (prev, { fetchMoreResult }) => {
        if (!fetchMoreResult) return prev;

        return {
          feed: {
            ...fetchMoreResult.feed,
            posts: [...prev.feed.posts, ...fetchMoreResult.feed.posts],
          },
        };
      },
    });
  }, [data, fetchMore, limit]);

  return {
    posts: data?.feed.posts ?? [],
    hasMore: data?.feed.hasMore ?? false,
    loading,
    error,
    loadMore,
  };
}
```

---

## Validation Rules

### Backend Validation

```typescript
// src/utils/validation.ts

export const validationRules = {
  username: {
    minLength: 3,
    maxLength: 30,
    pattern: /^[a-zA-Z0-9_]+$/,
    message:
      "Username must be 3-30 characters, alphanumeric and underscores only",
  },
  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: "Please enter a valid email address",
  },
  password: {
    minLength: 8,
    maxLength: 100,
    message: "Password must be at least 8 characters",
  },
  prompt: {
    minLength: 3,
    maxLength: 1000,
    message: "Prompt must be between 3 and 1000 characters",
  },
};

export function validateUsername(username: string): string | null {
  const { minLength, maxLength, pattern, message } = validationRules.username;

  if (username.length < minLength || username.length > maxLength) {
    return message;
  }
  if (!pattern.test(username)) {
    return message;
  }
  return null;
}

export function validateEmail(email: string): string | null {
  if (!validationRules.email.pattern.test(email)) {
    return validationRules.email.message;
  }
  return null;
}

export function validatePassword(password: string): string | null {
  const { minLength, message } = validationRules.password;
  if (password.length < minLength) {
    return message;
  }
  return null;
}

export function validatePrompt(prompt: string): string | null {
  const { minLength, maxLength, message } = validationRules.prompt;
  const trimmed = prompt.trim();

  if (trimmed.length < minLength || trimmed.length > maxLength) {
    return message;
  }
  return null;
}
```

---

## Error Handling

### Error Types

```typescript
// src/utils/errors.ts

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const ErrorCodes = {
  // Auth errors
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  USER_EXISTS: "USER_EXISTS",
  UNAUTHORIZED: "UNAUTHORIZED",

  // Validation errors
  INVALID_INPUT: "INVALID_INPUT",

  // Post errors
  POST_NOT_FOUND: "POST_NOT_FOUND",
  GENERATION_FAILED: "GENERATION_FAILED",

  // General errors
  INTERNAL_ERROR: "INTERNAL_ERROR",
  RATE_LIMITED: "RATE_LIMITED",
};
```

### Frontend Error Handling

```typescript
// src/utils/errorHandler.ts

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    // GraphQL errors
    if ("graphQLErrors" in error) {
      const gqlError = (error as any).graphQLErrors[0];
      if (gqlError?.message) {
        return gqlError.message;
      }
    }

    // Network errors
    if ("networkError" in error) {
      return "Network error. Please check your connection.";
    }

    return error.message;
  }

  return "An unexpected error occurred";
}
```

---

## Security Considerations

1. **Authentication**: JWT tokens with 7-day expiry, stored in localStorage (consider httpOnly cookies for production)

2. **Password Security**: bcrypt with cost factor 12

3. **Input Sanitization**: All user inputs validated and sanitized before database operations

4. **Rate Limiting**: Implement rate limiting on:

   - Login attempts (5 per minute per IP)
   - Image generation (10 per hour per user)
   - API requests (100 per minute per user)

5. **CORS**: Strict origin configuration

6. **Prompt Filtering**: Consider implementing content moderation for prompts to prevent abuse

---

## Performance Optimizations

1. **Database Indexes**: On frequently queried columns (user_id, created_at, post_id)

2. **Pagination**: Cursor-based pagination for infinite scroll

3. **Image Optimization**: Leonardo AI handles this, but consider CDN caching

4. **Apollo Client Caching**: Leverage Apollo's normalized cache

5. **Lazy Loading**: React.lazy for route-based code splitting

6. **Optimistic Updates**: For likes to provide instant feedback

---

## Testing Strategy

### Unit Tests

- Validation functions
- Utility functions
- React hooks (with @testing-library/react-hooks)

### Integration Tests

- GraphQL resolvers
- Authentication flow
- Database operations

### E2E Tests (Playwright or Cypress)

- User signup/login flow
- Post creation flow
- Like/unlike flow
- Feed navigation

---

## Deployment Considerations

### Backend

- Node.js 18+ runtime
- PostgreSQL 14+
- Environment variables for all secrets
- Health check endpoint at `/health`

### Frontend

- Static hosting (Vercel, Netlify, or S3 + CloudFront)
- Environment variables at build time

### Database

- Connection pooling (PgBouncer recommended for production)
- Regular backups
- SSL connections required

---

## File Structure Summary

```
aipics/
├── backend/
│   ├── src/
│   │   ├── resolvers/
│   │   │   ├── auth.ts
│   │   │   ├── post.ts
│   │   │   ├── like.ts
│   │   │   └── index.ts
│   │   ├── services/
│   │   │   └── leonardo.ts
│   │   ├── utils/
│   │   │   ├── validation.ts
│   │   │   └── errors.ts
│   │   ├── schema.ts
│   │   └── index.ts
│   ├── prisma/
│   │   └── schema.prisma
│   ├── package.json
│   ├── tsconfig.json
│   └── .env
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── graphql/
│   │   ├── context/
│   │   ├── utils/
│   │   ├── styles/
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── public/
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── .env
│
└── README.md
```

---

## Getting Started Commands

```bash
# Clone and setup
mkdir aipics && cd aipics

# Backend setup
mkdir backend && cd backend
npm init -y
npm install express @apollo/server graphql @prisma/client bcrypt jsonwebtoken cors
npm install -D typescript @types/node @types/express @types/bcrypt @types/jsonwebtoken prisma ts-node nodemon

# Initialize Prisma
npx prisma init

# Frontend setup
cd ..
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install @apollo/client graphql react-router-dom
npm install -D @types/react @types/react-dom
```

---

This specification provides everything needed to build AIPics from scratch. The document covers database design, API structure, frontend architecture, UI/UX details, and implementation patterns that can be directly used with Claude Code or any AI coding assistant.

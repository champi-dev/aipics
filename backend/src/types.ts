import { PrismaClient } from "@prisma/client";

export interface Context {
  prisma: PrismaClient;
  userId: string | null;
}

export interface SignupInput {
  username: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

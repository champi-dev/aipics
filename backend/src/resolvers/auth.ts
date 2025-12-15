import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { validateUsername, validateEmail, validatePassword } from "../utils/validation";
import { Context, SignupInput, LoginInput } from "../types";

export const authResolvers = {
  Mutation: {
    signup: async (
      _: unknown,
      { input }: { input: SignupInput },
      { prisma }: Context
    ) => {
      const { username, email, password } = input;

      // Validate inputs
      const usernameError = validateUsername(username);
      if (usernameError) throw new Error(usernameError);

      const emailError = validateEmail(email);
      if (emailError) throw new Error(emailError);

      const passwordError = validatePassword(password);
      if (passwordError) throw new Error(passwordError);

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

    login: async (
      _: unknown,
      { input }: { input: LoginInput },
      { prisma }: Context
    ) => {
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
    me: async (_: unknown, __: unknown, { prisma, userId }: Context) => {
      if (!userId) return null;
      return prisma.user.findUnique({ where: { id: userId } });
    },
  },
};

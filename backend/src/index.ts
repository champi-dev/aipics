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

  // Health check endpoint
  app.get("/health", (_, res) => {
    res.json({ status: "ok" });
  });

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
        let userId: string | null = null;

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

startServer().catch(console.error);

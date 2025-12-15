import { createServer } from "http";
import express from "express";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { WebSocketServer } from "ws";
import { useServer } from "graphql-ws/lib/use/ws";
import { PrismaClient } from "@prisma/client";
import cors from "cors";
import jwt from "jsonwebtoken";
import { typeDefs } from "./schema";
import { resolvers } from "./resolvers";

const prisma = new PrismaClient();

async function startServer() {
  const app = express();
  const httpServer = createServer(app);

  // Create executable schema
  const schema = makeExecutableSchema({ typeDefs, resolvers });

  // Create WebSocket server
  const wsServer = new WebSocketServer({
    server: httpServer,
    path: "/graphql",
  });

  // Set up WebSocket server with graphql-ws
  const serverCleanup = useServer(
    {
      schema,
      context: async (ctx: { connectionParams?: { authorization?: string } }) => {
        // Get token from connection params
        const token = ctx.connectionParams?.authorization;
        let userId: string | null = null;

        if (token) {
          try {
            const decoded = jwt.verify(
              token.replace("Bearer ", ""),
              process.env.JWT_SECRET!
            ) as { userId: string };
            userId = decoded.userId;
          } catch (e) {
            // Invalid token
          }
        }

        return { prisma, userId };
      },
    },
    wsServer
  );

  // Create Apollo Server
  const server = new ApolloServer({
    schema,
    plugins: [
      // Proper shutdown for HTTP server
      ApolloServerPluginDrainHttpServer({ httpServer }),
      // Proper shutdown for WebSocket server
      {
        async serverWillStart() {
          return {
            async drainServer() {
              await serverCleanup.dispose();
            },
          };
        },
      },
    ],
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

  httpServer.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/graphql`);
    console.log(`WebSocket server running at ws://localhost:${PORT}/graphql`);
  });
}

startServer().catch(console.error);

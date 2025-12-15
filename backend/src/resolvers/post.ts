import { LeonardoService } from "../services/leonardo";
import { validatePrompt } from "../utils/validation";
import { Context } from "../types";

const leonardo = new LeonardoService();

export const postResolvers = {
  Query: {
    feed: async (
      _: unknown,
      { cursor, limit = 20 }: { cursor?: string; limit?: number },
      { prisma }: Context
    ) => {
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

    post: async (_: unknown, { id }: { id: string }, { prisma }: Context) => {
      return prisma.post.findUnique({
        where: { id },
        include: { user: true },
      });
    },

    generationStatus: async (
      _: unknown,
      { postId }: { postId: string },
      { prisma }: Context
    ) => {
      return prisma.post.findUnique({
        where: { id: postId },
        include: { user: true },
      });
    },

    user: async (
      _: unknown,
      { username }: { username: string },
      { prisma }: Context
    ) => {
      return prisma.user.findUnique({ where: { username } });
    },

    userPosts: async (
      _: unknown,
      {
        username,
        cursor,
        limit = 20,
      }: { username: string; cursor?: string; limit?: number },
      { prisma }: Context
    ) => {
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
    createPost: async (
      _: unknown,
      { prompt }: { prompt: string },
      { prisma, userId }: Context
    ) => {
      if (!userId) throw new Error("Authentication required");

      // Validate prompt
      const promptError = validatePrompt(prompt);
      if (promptError) throw new Error(promptError);

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

    deletePost: async (
      _: unknown,
      { id }: { id: string },
      { prisma, userId }: Context
    ) => {
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
    isLikedByMe: async (
      post: { id: string },
      _: unknown,
      { prisma, userId }: Context
    ) => {
      if (!userId) return false;

      const like = await prisma.like.findUnique({
        where: {
          userId_postId: { userId, postId: post.id },
        },
      });

      return !!like;
    },
    status: (post: { status: string }) => post.status.toUpperCase(),
    createdAt: (post: { createdAt: Date }) => post.createdAt.toISOString(),
  },

  User: {
    postsCount: async (user: { id: string }, _: unknown, { prisma }: Context) => {
      return prisma.post.count({
        where: { userId: user.id, status: "completed" },
      });
    },
    createdAt: (user: { createdAt: Date }) => user.createdAt.toISOString(),
  },
};

import { Context } from "../types";

export const likeResolvers = {
  Mutation: {
    likePost: async (
      _: unknown,
      { postId }: { postId: string },
      { prisma, userId }: Context
    ) => {
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

    unlikePost: async (
      _: unknown,
      { postId }: { postId: string },
      { prisma, userId }: Context
    ) => {
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

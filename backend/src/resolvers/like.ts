import { Context } from "../types";
import { pubsub, EVENTS } from "../pubsub";

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
        const updatedPost = await prisma.post.update({
          where: { id: postId },
          data: { likesCount: { increment: 1 } },
          include: { user: true },
        });

        // Publish event for real-time updates
        pubsub.publish(EVENTS.POST_LIKE_UPDATED, {
          postLikeUpdated: { postId, likesCount: updatedPost.likesCount },
        });

        return updatedPost;
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

        const updatedPost = await prisma.post.update({
          where: { id: postId },
          data: { likesCount: { decrement: 1 } },
          include: { user: true },
        });

        // Publish event for real-time updates
        pubsub.publish(EVENTS.POST_LIKE_UPDATED, {
          postLikeUpdated: { postId, likesCount: updatedPost.likesCount },
        });

        return updatedPost;
      }

      return prisma.post.findUnique({
        where: { id: postId },
        include: { user: true },
      });
    },
  },
};

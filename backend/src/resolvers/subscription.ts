import { pubsub, EVENTS } from "../pubsub";

export const subscriptionResolvers = {
  Subscription: {
    postCreated: {
      subscribe: () => pubsub.asyncIterableIterator([EVENTS.POST_CREATED]),
    },
    postLikeUpdated: {
      subscribe: (_: unknown, { postId }: { postId?: string }) => {
        // If postId is provided, filter to only that post's updates
        // For simplicity, we'll subscribe to all updates and filter client-side
        // or you can implement filtering here
        return pubsub.asyncIterableIterator([EVENTS.POST_LIKE_UPDATED]);
      },
    },
  },
};

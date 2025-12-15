import { useCallback, useEffect } from "react";
import { useQuery } from "@apollo/client";
import { GET_FEED } from "../graphql/queries";
import { POST_CREATED_SUBSCRIPTION } from "../graphql/subscriptions";

interface Post {
  id: string;
  prompt: string;
  imageUrl: string;
  status: string;
  likesCount: number;
  isLikedByMe: boolean;
  createdAt: string;
  user: {
    id: string;
    username: string;
    avatarUrl: string | null;
  };
}

interface FeedData {
  feed: {
    posts: Post[];
    hasMore: boolean;
    nextCursor: string | null;
  };
}

interface PostCreatedData {
  postCreated: Post;
}

export function useFeed(limit = 20) {
  const { data, loading, error, fetchMore, subscribeToMore } = useQuery<FeedData>(GET_FEED, {
    variables: { limit },
    notifyOnNetworkStatusChange: true,
  });

  // Subscribe to new posts
  useEffect(() => {
    const unsubscribe = subscribeToMore<PostCreatedData>({
      document: POST_CREATED_SUBSCRIPTION,
      updateQuery: (prev, { subscriptionData }) => {
        if (!subscriptionData.data) return prev;

        const newPost = subscriptionData.data.postCreated;

        // Check if post already exists to avoid duplicates
        const exists = prev.feed.posts.some((post) => post.id === newPost.id);
        if (exists) return prev;

        return {
          ...prev,
          feed: {
            ...prev.feed,
            posts: [newPost, ...prev.feed.posts],
          },
        };
      },
    });

    return () => unsubscribe();
  }, [subscribeToMore]);

  const loadMore = useCallback(() => {
    if (!data?.feed.hasMore) return;

    fetchMore({
      variables: {
        cursor: data.feed.nextCursor,
        limit,
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

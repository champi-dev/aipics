import { useCallback } from "react";
import { useQuery } from "@apollo/client";
import { GET_FEED } from "../graphql/queries";

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

export function useFeed(limit = 20) {
  const { data, loading, error, fetchMore } = useQuery<FeedData>(GET_FEED, {
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

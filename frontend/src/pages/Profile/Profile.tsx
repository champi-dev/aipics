import { useParams } from "react-router-dom";
import { useQuery } from "@apollo/client";
import { GET_USER, GET_USER_POSTS } from "../../graphql/queries";
import { Avatar } from "../../components/common/Avatar";
import { Spinner } from "../../components/common/Spinner";
import { PostGrid } from "../../components/post/PostGrid";
import { Button } from "../../components/common/Button";
import { formatFullDate } from "../../utils/formatDate";
import styles from "./Profile.module.css";
import { useCallback, useEffect, useRef } from "react";

interface User {
  id: string;
  username: string;
  email: string;
  avatarUrl: string | null;
  createdAt: string;
  postsCount: number;
}

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

interface UserData {
  user: User | null;
}

interface UserPostsData {
  userPosts: {
    posts: Post[];
    hasMore: boolean;
    nextCursor: string | null;
  };
}

export function Profile() {
  const { username } = useParams<{ username: string }>();
  const observerTarget = useRef<HTMLDivElement>(null);

  const { data: userData, loading: userLoading, error: userError } = useQuery<UserData>(GET_USER, {
    variables: { username },
    skip: !username,
  });

  const {
    data: postsData,
    loading: postsLoading,
    error: postsError,
    fetchMore,
  } = useQuery<UserPostsData>(GET_USER_POSTS, {
    variables: { username, limit: 20 },
    skip: !username,
    notifyOnNetworkStatusChange: true,
  });

  const loadMore = useCallback(() => {
    if (!postsData?.userPosts.hasMore) return;

    fetchMore({
      variables: {
        username,
        cursor: postsData.userPosts.nextCursor,
        limit: 20,
      },
    });
  }, [postsData, fetchMore, username]);

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry.isIntersecting && postsData?.userPosts.hasMore && !postsLoading) {
        loadMore();
      }
    },
    [postsData?.userPosts.hasMore, postsLoading, loadMore]
  );

  useEffect(() => {
    const element = observerTarget.current;
    if (!element) return;

    const observer = new IntersectionObserver(handleObserver, {
      threshold: 0.1,
    });

    observer.observe(element);

    return () => observer.disconnect();
  }, [handleObserver]);

  if (userLoading) {
    return (
      <div className={styles.loading}>
        <Spinner size="lg" />
      </div>
    );
  }

  if (userError || postsError) {
    return (
      <div className={styles.error}>
        <p>Something went wrong</p>
        <Button onClick={() => window.location.reload()}>Try Again</Button>
      </div>
    );
  }

  if (!userData?.user) {
    return (
      <div className={styles.notFound}>
        <p className={styles.notFoundTitle}>User not found</p>
        <p className={styles.notFoundText}>
          The user @{username} doesn't exist or has been removed.
        </p>
      </div>
    );
  }

  const user = userData.user;
  const posts = postsData?.userPosts.posts ?? [];
  const hasMore = postsData?.userPosts.hasMore ?? false;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <Avatar src={user.avatarUrl} username={user.username} size="lg" />
        <div className={styles.info}>
          <h1 className={styles.username}>@{user.username}</h1>
          <p className={styles.meta}>
            Joined {formatFullDate(user.createdAt)}
          </p>
          <p className={styles.stats}>
            {user.postsCount} {user.postsCount === 1 ? "creation" : "creations"}
          </p>
        </div>
      </header>

      {posts.length > 0 ? (
        <PostGrid posts={posts} />
      ) : (
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>No creations yet</p>
          <p className={styles.emptyText}>
            This user hasn't created any images yet.
          </p>
        </div>
      )}

      <div ref={observerTarget} className={styles.loadMore}>
        {postsLoading && posts.length > 0 && <Spinner />}
        {!hasMore && posts.length > 0 && (
          <p className={styles.endMessage}>You've reached the end</p>
        )}
      </div>
    </div>
  );
}

import { useEffect, useRef, useCallback } from "react";
import { useFeed } from "../../../hooks/useFeed";
import { useCreatePost } from "../../../hooks/useCreatePost";
import { PostGrid } from "../../post/PostGrid";
import { GeneratingPost } from "../../post/GeneratingPost";
import { Spinner } from "../../common/Spinner";
import { Button } from "../../common/Button";
import styles from "./Feed.module.css";

export function Feed() {
  const { posts, hasMore, loading, error, loadMore } = useFeed();
  const { generatingPost } = useCreatePost();
  const observerTarget = useRef<HTMLDivElement>(null);

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry.isIntersecting && hasMore && !loading) {
        loadMore();
      }
    },
    [hasMore, loading, loadMore]
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

  if (error) {
    return (
      <div className={styles.error}>
        <p>Something went wrong</p>
        <p className={styles.errorMessage}>Could not load the feed</p>
        <Button onClick={() => window.location.reload()}>Try Again</Button>
      </div>
    );
  }

  if (loading && posts.length === 0) {
    return (
      <div className={styles.loading}>
        <Spinner size="lg" />
      </div>
    );
  }

  if (posts.length === 0 && !generatingPost) {
    return (
      <div className={styles.empty}>
        <p className={styles.emptyTitle}>Welcome to AIPics!</p>
        <p className={styles.emptyText}>
          Create your first AI image by typing a prompt above.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.feed}>
      {generatingPost && (
        <div className={styles.generatingWrapper}>
          <GeneratingPost post={generatingPost} />
        </div>
      )}

      <PostGrid posts={posts} />

      <div ref={observerTarget} className={styles.loadMore}>
        {loading && <Spinner />}
        {!hasMore && posts.length > 0 && (
          <p className={styles.endMessage}>You've reached the end</p>
        )}
      </div>
    </div>
  );
}

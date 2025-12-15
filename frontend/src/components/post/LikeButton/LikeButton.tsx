import { useState, useEffect } from "react";
import { useMutation, useSubscription } from "@apollo/client";
import { LIKE_POST, UNLIKE_POST } from "../../../graphql/mutations";
import { POST_LIKE_UPDATED_SUBSCRIPTION } from "../../../graphql/subscriptions";
import { useAuth } from "../../../hooks/useAuth";
import styles from "./LikeButton.module.css";

interface LikeButtonProps {
  postId: string;
  likesCount: number;
  isLiked: boolean;
  onAuthRequired: () => void;
}

interface LikeUpdateData {
  postLikeUpdated: {
    postId: string;
    likesCount: number;
  };
}

export function LikeButton({ postId, likesCount, isLiked, onAuthRequired }: LikeButtonProps) {
  const { isAuthenticated } = useAuth();
  const [optimisticLiked, setOptimisticLiked] = useState(isLiked);
  const [displayCount, setDisplayCount] = useState(likesCount);
  const [isAnimating, setIsAnimating] = useState(false);

  const [likePost] = useMutation(LIKE_POST);
  const [unlikePost] = useMutation(UNLIKE_POST);

  // Subscribe to like updates for this post
  const { data: subscriptionData } = useSubscription<LikeUpdateData>(
    POST_LIKE_UPDATED_SUBSCRIPTION,
    { variables: { postId } }
  );

  // Update display count when subscription data changes
  useEffect(() => {
    if (subscriptionData?.postLikeUpdated?.postId === postId) {
      setDisplayCount(subscriptionData.postLikeUpdated.likesCount);
    }
  }, [subscriptionData, postId]);

  // Sync with props when they change (e.g., initial load)
  useEffect(() => {
    setDisplayCount(likesCount);
    setOptimisticLiked(isLiked);
  }, [likesCount, isLiked]);

  const handleClick = async () => {
    if (!isAuthenticated) {
      onAuthRequired();
      return;
    }

    const wasLiked = optimisticLiked;
    const prevCount = displayCount;

    // Optimistic update
    setOptimisticLiked(!wasLiked);
    setDisplayCount(wasLiked ? prevCount - 1 : prevCount + 1);

    if (!wasLiked) {
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 300);
    }

    try {
      if (wasLiked) {
        await unlikePost({ variables: { postId } });
      } else {
        await likePost({ variables: { postId } });
      }
    } catch {
      // Revert on error
      setOptimisticLiked(wasLiked);
      setDisplayCount(prevCount);
    }
  };

  return (
    <button
      className={`${styles.button} ${optimisticLiked ? styles.liked : ""} ${isAnimating ? styles.animating : ""}`}
      onClick={handleClick}
      aria-label={optimisticLiked ? "Unlike" : "Like"}
    >
      <svg
        viewBox="0 0 24 24"
        className={styles.icon}
        fill={optimisticLiked ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
      <span className={styles.count}>{displayCount.toLocaleString()}</span>
    </button>
  );
}

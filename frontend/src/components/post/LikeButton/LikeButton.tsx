import { useState } from "react";
import { useMutation } from "@apollo/client";
import { LIKE_POST, UNLIKE_POST } from "../../../graphql/mutations";
import { useAuth } from "../../../hooks/useAuth";
import styles from "./LikeButton.module.css";

interface LikeButtonProps {
  postId: string;
  likesCount: number;
  isLiked: boolean;
  onAuthRequired: () => void;
}

export function LikeButton({ postId, likesCount, isLiked, onAuthRequired }: LikeButtonProps) {
  const { isAuthenticated } = useAuth();
  const [optimisticLiked, setOptimisticLiked] = useState(isLiked);
  const [optimisticCount, setOptimisticCount] = useState(likesCount);
  const [isAnimating, setIsAnimating] = useState(false);

  const [likePost] = useMutation(LIKE_POST);
  const [unlikePost] = useMutation(UNLIKE_POST);

  const handleClick = async () => {
    if (!isAuthenticated) {
      onAuthRequired();
      return;
    }

    // Optimistic update
    setOptimisticLiked(!optimisticLiked);
    setOptimisticCount(optimisticLiked ? optimisticCount - 1 : optimisticCount + 1);

    if (!optimisticLiked) {
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 300);
    }

    try {
      if (optimisticLiked) {
        await unlikePost({ variables: { postId } });
      } else {
        await likePost({ variables: { postId } });
      }
    } catch {
      // Revert on error
      setOptimisticLiked(optimisticLiked);
      setOptimisticCount(likesCount);
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
      <span className={styles.count}>{optimisticCount.toLocaleString()}</span>
    </button>
  );
}

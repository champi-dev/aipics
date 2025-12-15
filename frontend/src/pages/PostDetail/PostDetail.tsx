import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@apollo/client";
import { GET_POST } from "../../graphql/queries";
import { Avatar } from "../../components/common/Avatar";
import { Spinner } from "../../components/common/Spinner";
import { Button } from "../../components/common/Button";
import { LikeButton } from "../../components/post/LikeButton";
import { AuthModal } from "../../components/auth/AuthModal";
import { formatDate } from "../../utils/formatDate";
import styles from "./PostDetail.module.css";

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

interface PostData {
  post: Post | null;
}

export function PostDetail() {
  const { id } = useParams<{ id: string }>();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const { data, loading, error } = useQuery<PostData>(GET_POST, {
    variables: { id },
    skip: !id,
  });

  if (loading) {
    return (
      <div className={styles.loading}>
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.error}>
        <p>Something went wrong</p>
        <Button onClick={() => window.location.reload()}>Try Again</Button>
      </div>
    );
  }

  if (!data?.post) {
    return (
      <div className={styles.notFound}>
        <p className={styles.notFoundTitle}>Post not found</p>
        <p className={styles.notFoundText}>
          This post doesn't exist or has been removed.
        </p>
        <Link to="/">
          <Button>Back to Home</Button>
        </Link>
      </div>
    );
  }

  const post = data.post;

  return (
    <>
      <div className={styles.container}>
        <div className={styles.imageContainer}>
          <img src={post.imageUrl} alt={post.prompt} className={styles.image} />
        </div>

        <div className={styles.details}>
          <Link to={`/${post.user.username}`} className={styles.user}>
            <Avatar
              src={post.user.avatarUrl}
              username={post.user.username}
              size="md"
            />
            <div className={styles.userInfo}>
              <span className={styles.username}>@{post.user.username}</span>
              <span className={styles.time}>{formatDate(post.createdAt)}</span>
            </div>
          </Link>

          <p className={styles.prompt}>{post.prompt}</p>

          <div className={styles.actions}>
            <LikeButton
              postId={post.id}
              likesCount={post.likesCount}
              isLiked={post.isLikedByMe}
              onAuthRequired={() => setShowAuthModal(true)}
            />
          </div>
        </div>
      </div>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </>
  );
}

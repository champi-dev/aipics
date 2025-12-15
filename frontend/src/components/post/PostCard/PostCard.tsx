import { useState } from "react";
import { Link } from "react-router-dom";
import { Avatar } from "../../common/Avatar";
import { LikeButton } from "../LikeButton";
import { AuthModal } from "../../auth/AuthModal";
import { formatDate } from "../../../utils/formatDate";
import styles from "./PostCard.module.css";

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

interface PostCardProps {
  post: Post;
}

export function PostCard({ post }: PostCardProps) {
  const [showAuthModal, setShowAuthModal] = useState(false);

  return (
    <>
      <article className={styles.card}>
        <div className={styles.imageContainer}>
          <img
            src={post.imageUrl}
            alt={post.prompt}
            className={styles.image}
            loading="lazy"
          />
        </div>

        <div className={styles.content}>
          <p className={styles.prompt}>{post.prompt}</p>

          <div className={styles.footer}>
            <Link to={`/${post.user.username}`} className={styles.user}>
              <Avatar
                src={post.user.avatarUrl}
                username={post.user.username}
                size="sm"
              />
              <div className={styles.userInfo}>
                <span className={styles.username}>@{post.user.username}</span>
                <span className={styles.time}>{formatDate(post.createdAt)}</span>
              </div>
            </Link>

            <LikeButton
              postId={post.id}
              likesCount={post.likesCount}
              isLiked={post.isLikedByMe}
              onAuthRequired={() => setShowAuthModal(true)}
            />
          </div>
        </div>
      </article>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </>
  );
}

import { Avatar } from "../../common/Avatar";
import { Spinner } from "../../common/Spinner";
import styles from "./GeneratingPost.module.css";

interface Post {
  id: string;
  prompt: string;
  user: {
    id: string;
    username: string;
    avatarUrl: string | null;
  };
}

interface GeneratingPostProps {
  post: Post;
}

export function GeneratingPost({ post }: GeneratingPostProps) {
  return (
    <article className={styles.card}>
      <div className={styles.imageContainer}>
        <div className={styles.generating}>
          <Spinner size="lg" />
          <span className={styles.generatingText}>Generating...</span>
        </div>
      </div>

      <div className={styles.content}>
        <p className={styles.prompt}>{post.prompt}</p>

        <div className={styles.footer}>
          <div className={styles.user}>
            <Avatar
              src={post.user.avatarUrl}
              username={post.user.username}
              size="sm"
            />
            <div className={styles.userInfo}>
              <span className={styles.username}>@{post.user.username}</span>
              <span className={styles.time}>Just now</span>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

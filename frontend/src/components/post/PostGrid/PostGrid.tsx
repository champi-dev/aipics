import { PostCard } from "../PostCard";
import styles from "./PostGrid.module.css";

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

interface PostGridProps {
  posts: Post[];
}

export function PostGrid({ posts }: PostGridProps) {
  if (posts.length === 0) {
    return null;
  }

  return (
    <div className={styles.grid}>
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}

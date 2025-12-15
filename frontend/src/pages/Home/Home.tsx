import { CreatePost } from "../../components/post/CreatePost";
import { Feed } from "../../components/feed/Feed";
import styles from "./Home.module.css";

export function Home() {
  return (
    <div className={styles.container}>
      <CreatePost />
      <Feed />
    </div>
  );
}

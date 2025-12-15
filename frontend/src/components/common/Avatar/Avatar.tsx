import styles from "./Avatar.module.css";

interface AvatarProps {
  src?: string | null;
  username: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Avatar({ src, username, size = "md", className = "" }: AvatarProps) {
  const initials = username.slice(0, 2).toUpperCase();

  return (
    <div className={`${styles.avatar} ${styles[size]} ${className}`}>
      {src ? (
        <img src={src} alt={username} className={styles.image} />
      ) : (
        <span className={styles.initials}>{initials}</span>
      )}
    </div>
  );
}

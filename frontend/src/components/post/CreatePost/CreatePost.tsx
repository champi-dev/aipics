import { useState, FormEvent } from "react";
import { useAuth } from "../../../hooks/useAuth";
import { useCreatePost } from "../../../hooks/useCreatePost";
import { Button } from "../../common/Button";
import { AuthModal } from "../../auth/AuthModal";
import { getErrorMessage } from "../../../utils/errorHandler";
import styles from "./CreatePost.module.css";

export function CreatePost() {
  const { isAuthenticated } = useAuth();
  const { createPost, isGenerating } = useCreatePost();
  const [prompt, setPrompt] = useState("");
  const [error, setError] = useState("");
  const [showAuthModal, setShowAuthModal] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    if (prompt.trim().length < 3) {
      setError("Prompt must be at least 3 characters");
      return;
    }

    setError("");

    try {
      await createPost(prompt);
      setPrompt("");
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.inputWrapper}>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe your image..."
            className={styles.textarea}
            rows={2}
            maxLength={1000}
            disabled={isGenerating}
          />
          <div className={styles.actions}>
            <span className={styles.charCount}>{prompt.length}/1000</span>
            <Button
              type="submit"
              disabled={prompt.trim().length < 3 || isGenerating}
              isLoading={isGenerating}
            >
              Create
            </Button>
          </div>
        </div>

        {error && <p className={styles.error}>{error}</p>}

        <p className={styles.tip}>
          Tip: Be descriptive! Include style, mood, colors, and details.
        </p>
      </form>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </>
  );
}

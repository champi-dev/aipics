import { useState, FormEvent } from "react";
import { useAuth } from "../../../hooks/useAuth";
import { Input } from "../../common/Input";
import { Button } from "../../common/Button";
import { getErrorMessage } from "../../../utils/errorHandler";
import styles from "./SignupForm.module.css";

interface SignupFormProps {
  onSuccess: () => void;
  onSwitchToLogin: () => void;
}

export function SignupForm({ onSuccess, onSwitchToLogin }: SignupFormProps) {
  const { signup, signupLoading } = useAuth();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      await signup(username, email, password);
      onSuccess();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <h2 className={styles.title}>Create account</h2>
      <p className={styles.subtitle}>Join AIPics and start creating</p>

      {error && <div className={styles.error}>{error}</div>}

      <Input
        type="text"
        label="Username"
        placeholder="yourname"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        required
        minLength={3}
        maxLength={30}
        pattern="^[a-zA-Z0-9_]+$"
      />

      <Input
        type="email"
        label="Email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />

      <Input
        type="password"
        label="Password"
        placeholder="At least 8 characters"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        minLength={8}
      />

      <Button type="submit" isLoading={signupLoading} className={styles.submitButton}>
        Sign Up
      </Button>

      <div className={styles.divider}>
        <span>or</span>
      </div>

      <p className={styles.switchText}>
        Already have an account?{" "}
        <button type="button" onClick={onSwitchToLogin} className={styles.switchLink}>
          Log in
        </button>
      </p>
    </form>
  );
}

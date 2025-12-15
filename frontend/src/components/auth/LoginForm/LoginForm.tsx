import { useState, FormEvent } from "react";
import { useAuth } from "../../../hooks/useAuth";
import { Input } from "../../common/Input";
import { Button } from "../../common/Button";
import { getErrorMessage } from "../../../utils/errorHandler";
import styles from "./LoginForm.module.css";

interface LoginFormProps {
  onSuccess: () => void;
  onSwitchToSignup: () => void;
}

export function LoginForm({ onSuccess, onSwitchToSignup }: LoginFormProps) {
  const { login, loginLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      await login(email, password);
      onSuccess();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <h2 className={styles.title}>Welcome back</h2>
      <p className={styles.subtitle}>Log in to your AIPics account</p>

      {error && <div className={styles.error}>{error}</div>}

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
        placeholder="Your password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />

      <Button type="submit" isLoading={loginLoading} className={styles.submitButton}>
        Log In
      </Button>

      <div className={styles.divider}>
        <span>or</span>
      </div>

      <p className={styles.switchText}>
        Don't have an account?{" "}
        <button type="button" onClick={onSwitchToSignup} className={styles.switchLink}>
          Sign up
        </button>
      </p>
    </form>
  );
}

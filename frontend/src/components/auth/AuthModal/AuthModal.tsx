import { useState } from "react";
import { Modal } from "../../common/Modal";
import { LoginForm } from "../LoginForm";
import { SignupForm } from "../SignupForm";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [mode, setMode] = useState<"login" | "signup">("login");

  const handleSuccess = () => {
    onClose();
    setMode("login");
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      {mode === "login" ? (
        <LoginForm
          onSuccess={handleSuccess}
          onSwitchToSignup={() => setMode("signup")}
        />
      ) : (
        <SignupForm
          onSuccess={handleSuccess}
          onSwitchToLogin={() => setMode("login")}
        />
      )}
    </Modal>
  );
}

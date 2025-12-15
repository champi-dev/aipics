import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../../hooks/useAuth";
import { Button } from "../../common/Button";
import { Avatar } from "../../common/Avatar";
import { AuthModal } from "../../auth/AuthModal";
import styles from "./Header.module.css";

export function Header() {
  const { user, isAuthenticated, logout } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <>
      <header className={styles.header}>
        <div className={styles.container}>
          <Link to="/" className={styles.logo}>
            AIPics
          </Link>

          <nav className={styles.nav}>
            {isAuthenticated && user ? (
              <div className={styles.userMenu}>
                <button
                  className={styles.userButton}
                  onClick={() => setShowDropdown(!showDropdown)}
                >
                  <Avatar
                    src={user.avatarUrl}
                    username={user.username}
                    size="sm"
                  />
                  <span className={styles.username}>@{user.username}</span>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>

                {showDropdown && (
                  <div className={styles.dropdown}>
                    <Link
                      to={`/${user.username}`}
                      className={styles.dropdownItem}
                      onClick={() => setShowDropdown(false)}
                    >
                      Profile
                    </Link>
                    <button
                      className={styles.dropdownItem}
                      onClick={() => {
                        logout();
                        setShowDropdown(false);
                      }}
                    >
                      Log out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Button onClick={() => setShowAuthModal(true)}>
                Sign In
              </Button>
            )}
          </nav>
        </div>
      </header>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </>
  );
}

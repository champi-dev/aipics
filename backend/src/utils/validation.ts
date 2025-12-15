export const validationRules = {
  username: {
    minLength: 3,
    maxLength: 30,
    pattern: /^[a-zA-Z0-9_]+$/,
    message:
      "Username must be 3-30 characters, alphanumeric and underscores only",
  },
  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: "Please enter a valid email address",
  },
  password: {
    minLength: 8,
    maxLength: 100,
    message: "Password must be at least 8 characters",
  },
  prompt: {
    minLength: 3,
    maxLength: 1000,
    message: "Prompt must be between 3 and 1000 characters",
  },
};

export function validateUsername(username: string): string | null {
  const { minLength, maxLength, pattern, message } = validationRules.username;

  if (username.length < minLength || username.length > maxLength) {
    return message;
  }
  if (!pattern.test(username)) {
    return message;
  }
  return null;
}

export function validateEmail(email: string): string | null {
  if (!validationRules.email.pattern.test(email)) {
    return validationRules.email.message;
  }
  return null;
}

export function validatePassword(password: string): string | null {
  const { minLength, message } = validationRules.password;
  if (password.length < minLength) {
    return message;
  }
  return null;
}

export function validatePrompt(prompt: string): string | null {
  const { minLength, maxLength, message } = validationRules.prompt;
  const trimmed = prompt.trim();

  if (trimmed.length < minLength || trimmed.length > maxLength) {
    return message;
  }
  return null;
}

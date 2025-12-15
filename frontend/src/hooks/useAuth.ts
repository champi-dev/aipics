import { useContext, useCallback } from "react";
import { useMutation, useQuery, useApolloClient } from "@apollo/client";
import { AuthContext } from "../context/AuthContext";
import { LOGIN, SIGNUP } from "../graphql/mutations";
import { GET_ME } from "../graphql/queries";

interface User {
  id: string;
  username: string;
  email: string;
  avatarUrl: string | null;
  createdAt: string;
}

interface AuthPayload {
  token: string;
  user: User;
}

interface LoginData {
  login: AuthPayload;
}

interface SignupData {
  signup: AuthPayload;
}

interface MeData {
  me: User | null;
}

export function useAuth() {
  const context = useContext(AuthContext);
  const client = useApolloClient();

  const { data, loading: meLoading } = useQuery<MeData>(GET_ME, {
    skip: !context.token,
  });

  const [loginMutation, { loading: loginLoading }] = useMutation<LoginData>(LOGIN);
  const [signupMutation, { loading: signupLoading }] = useMutation<SignupData>(SIGNUP);

  const login = useCallback(
    async (email: string, password: string) => {
      const { data } = await loginMutation({
        variables: { input: { email, password } },
      });
      if (data) {
        context.setToken(data.login.token);
        return data.login.user;
      }
      throw new Error("Login failed");
    },
    [loginMutation, context]
  );

  const signup = useCallback(
    async (username: string, email: string, password: string) => {
      const { data } = await signupMutation({
        variables: { input: { username, email, password } },
      });
      if (data) {
        context.setToken(data.signup.token);
        return data.signup.user;
      }
      throw new Error("Signup failed");
    },
    [signupMutation, context]
  );

  const logout = useCallback(() => {
    context.setToken(null);
    client.resetStore();
  }, [context, client]);

  return {
    user: data?.me ?? null,
    isAuthenticated: !!context.token,
    isLoading: meLoading,
    login,
    signup,
    logout,
    loginLoading,
    signupLoading,
  };
}

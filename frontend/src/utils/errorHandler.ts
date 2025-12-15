import { ApolloError } from "@apollo/client";

export function getErrorMessage(error: unknown): string {
  if (error instanceof ApolloError) {
    const gqlError = error.graphQLErrors[0];
    if (gqlError?.message) {
      return gqlError.message;
    }

    if (error.networkError) {
      return "Network error. Please check your connection.";
    }

    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "An unexpected error occurred";
}

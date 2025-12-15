import { gql } from "@apollo/client";

export const USER_FRAGMENT = gql`
  fragment UserFragment on User {
    id
    username
    email
    avatarUrl
    createdAt
  }
`;

export const POST_FRAGMENT = gql`
  fragment PostFragment on Post {
    id
    prompt
    imageUrl
    status
    likesCount
    isLikedByMe
    createdAt
    user {
      id
      username
      avatarUrl
    }
  }
`;

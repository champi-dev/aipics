import { gql } from "@apollo/client";
import { POST_FRAGMENT, USER_FRAGMENT } from "./fragments";

export const GET_FEED = gql`
  ${POST_FRAGMENT}
  query GetFeed($cursor: String, $limit: Int) {
    feed(cursor: $cursor, limit: $limit) {
      posts {
        ...PostFragment
      }
      hasMore
      nextCursor
    }
  }
`;

export const GET_ME = gql`
  ${USER_FRAGMENT}
  query GetMe {
    me {
      ...UserFragment
    }
  }
`;

export const GET_USER = gql`
  ${USER_FRAGMENT}
  query GetUser($username: String!) {
    user(username: $username) {
      ...UserFragment
      postsCount
    }
  }
`;

export const GET_USER_POSTS = gql`
  ${POST_FRAGMENT}
  query GetUserPosts($username: String!, $cursor: String, $limit: Int) {
    userPosts(username: $username, cursor: $cursor, limit: $limit) {
      posts {
        ...PostFragment
      }
      hasMore
      nextCursor
    }
  }
`;

export const GET_POST = gql`
  ${POST_FRAGMENT}
  query GetPost($id: ID!) {
    post(id: $id) {
      ...PostFragment
    }
  }
`;

export const GET_GENERATION_STATUS = gql`
  ${POST_FRAGMENT}
  query GetGenerationStatus($postId: ID!) {
    generationStatus(postId: $postId) {
      ...PostFragment
    }
  }
`;

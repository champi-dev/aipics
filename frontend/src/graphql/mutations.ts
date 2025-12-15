import { gql } from "@apollo/client";
import { POST_FRAGMENT, USER_FRAGMENT } from "./fragments";

export const LOGIN = gql`
  ${USER_FRAGMENT}
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      token
      user {
        ...UserFragment
      }
    }
  }
`;

export const SIGNUP = gql`
  ${USER_FRAGMENT}
  mutation Signup($input: SignupInput!) {
    signup(input: $input) {
      token
      user {
        ...UserFragment
      }
    }
  }
`;

export const CREATE_POST = gql`
  ${POST_FRAGMENT}
  mutation CreatePost($prompt: String!) {
    createPost(prompt: $prompt) {
      ...PostFragment
    }
  }
`;

export const LIKE_POST = gql`
  mutation LikePost($postId: ID!) {
    likePost(postId: $postId) {
      id
      likesCount
      isLikedByMe
    }
  }
`;

export const UNLIKE_POST = gql`
  mutation UnlikePost($postId: ID!) {
    unlikePost(postId: $postId) {
      id
      likesCount
      isLikedByMe
    }
  }
`;

export const DELETE_POST = gql`
  mutation DeletePost($id: ID!) {
    deletePost(id: $id)
  }
`;

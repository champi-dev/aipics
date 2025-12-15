import { gql } from "@apollo/client";
import { POST_FRAGMENT } from "./fragments";

export const POST_CREATED_SUBSCRIPTION = gql`
  ${POST_FRAGMENT}
  subscription OnPostCreated {
    postCreated {
      ...PostFragment
    }
  }
`;

export const POST_LIKE_UPDATED_SUBSCRIPTION = gql`
  subscription OnPostLikeUpdated($postId: ID) {
    postLikeUpdated(postId: $postId) {
      postId
      likesCount
    }
  }
`;

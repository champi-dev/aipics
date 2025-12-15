export const typeDefs = `#graphql
  type User {
    id: ID!
    username: String!
    email: String!
    avatarUrl: String
    createdAt: String!
    posts: [Post!]!
    postsCount: Int!
  }

  type Post {
    id: ID!
    prompt: String!
    imageUrl: String!
    status: PostStatus!
    likesCount: Int!
    createdAt: String!
    user: User!
    isLikedByMe: Boolean!
  }

  enum PostStatus {
    GENERATING
    COMPLETED
    FAILED
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  type PostConnection {
    posts: [Post!]!
    hasMore: Boolean!
    nextCursor: String
  }

  type Query {
    me: User
    feed(cursor: String, limit: Int): PostConnection!
    user(username: String!): User
    userPosts(username: String!, cursor: String, limit: Int): PostConnection!
    post(id: ID!): Post
    generationStatus(postId: ID!): Post
  }

  type Mutation {
    signup(input: SignupInput!): AuthPayload!
    login(input: LoginInput!): AuthPayload!
    createPost(prompt: String!): Post!
    deletePost(id: ID!): Boolean!
    likePost(postId: ID!): Post!
    unlikePost(postId: ID!): Post!
  }

  input SignupInput {
    username: String!
    email: String!
    password: String!
  }

  input LoginInput {
    email: String!
    password: String!
  }

  type Subscription {
    postCreated: Post!
    postLikeUpdated(postId: ID): PostLikeUpdate!
  }

  type PostLikeUpdate {
    postId: ID!
    likesCount: Int!
  }
`;

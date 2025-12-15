import { authResolvers } from "./auth";
import { postResolvers } from "./post";
import { likeResolvers } from "./like";

export const resolvers = {
  Query: {
    ...authResolvers.Query,
    ...postResolvers.Query,
  },
  Mutation: {
    ...authResolvers.Mutation,
    ...postResolvers.Mutation,
    ...likeResolvers.Mutation,
  },
  Post: postResolvers.Post,
  User: postResolvers.User,
};

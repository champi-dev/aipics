import { authResolvers } from "./auth";
import { postResolvers } from "./post";
import { likeResolvers } from "./like";
import { subscriptionResolvers } from "./subscription";

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
  Subscription: subscriptionResolvers.Subscription,
  Post: postResolvers.Post,
  User: postResolvers.User,
};

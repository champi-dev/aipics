import { PubSub } from "graphql-subscriptions";

export const pubsub = new PubSub();

export const EVENTS = {
  POST_CREATED: "POST_CREATED",
  POST_LIKE_UPDATED: "POST_LIKE_UPDATED",
};

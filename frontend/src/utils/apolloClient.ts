import {
  ApolloClient,
  InMemoryCache,
  createHttpLink,
  split,
} from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { GraphQLWsLink } from "@apollo/client/link/subscriptions";
import { getMainDefinition } from "@apollo/client/utilities";
import { createClient } from "graphql-ws";

const httpUrl = import.meta.env.VITE_API_URL || "http://localhost:4000/graphql";
const wsUrl = httpUrl.replace(/^http/, "ws");

const httpLink = createHttpLink({
  uri: httpUrl,
});

const wsLink = new GraphQLWsLink(
  createClient({
    url: wsUrl,
    connectionParams: () => {
      const token = localStorage.getItem("token");
      return {
        authorization: token ? `Bearer ${token}` : "",
      };
    },
  })
);

const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem("token");
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    },
  };
});

// Split link: use WebSocket for subscriptions, HTTP for everything else
const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === "OperationDefinition" &&
      definition.operation === "subscription"
    );
  },
  wsLink,
  authLink.concat(httpLink)
);

export const apolloClient = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          feed: {
            keyArgs: false,
            merge(existing, incoming, { args }) {
              if (!args?.cursor) {
                return incoming;
              }
              return {
                ...incoming,
                posts: [...(existing?.posts || []), ...incoming.posts],
              };
            },
          },
          userPosts: {
            keyArgs: ["username"],
            merge(existing, incoming, { args }) {
              if (!args?.cursor) {
                return incoming;
              }
              return {
                ...incoming,
                posts: [...(existing?.posts || []), ...incoming.posts],
              };
            },
          },
        },
      },
    },
  }),
});

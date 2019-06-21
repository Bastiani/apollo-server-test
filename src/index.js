import Koa from "koa";
import { ApolloServer } from "apollo-server-koa";
import { PubSub } from "graphql-subscriptions";
import { koaPlayground } from "graphql-playground-middleware";
import cors from "koa-cors";
import Router from "koa-router";
import {
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLString,
  GraphQLNonNull,
  GraphQLList,
  GraphQLFloat,
  GraphQLInt
} from "graphql";

import fetchData from "./utils/fetchData";

const getRandomArbitrary = (min, max) => Math.random() * (max - min) + min;

const EVENTS = {
  ODD: {
    PRICE: "ODD_PRICE"
  }
};

const pubsub = new PubSub();

const OddType = new GraphQLObjectType({
  name: "Group",
  description: "Group type definition",
  fields: () => ({
    id: {
      type: GraphQLNonNull(GraphQLString)
    },
    price: {
      type: GraphQLFloat,
      description: "Price of the odd",
      resolve: odd => getRandomArbitrary(odd.price, odd.price + 10).toFixed(2)
    },
    availability: {
      type: GraphQLString,
      description: "Availability",
      resolve: odd => odd.availability
    },
    matchId: {
      type: GraphQLInt,
      description: "Match id of the odd",
      resolve: odd => odd.match_id
    },
    marketId: {
      type: GraphQLString,
      description: "Market id of the odd",
      resolve: odd => odd.market_id
    },
    outcomeId: {
      type: GraphQLString,
      description: "Outcome id of the odd",
      resolve: odd => odd.outcome_id
    },
    outcome: {
      type: GraphQLString,
      description: "Outcome of the odd",
      resolve: odd => odd.outcome
    },
    outcomeLabel: {
      type: GraphQLString,
      description: "Outcome label",
      resolve: odd => odd.outcome_label
    }
  })
});

const OddPriceType = new GraphQLObjectType({
  name: "OddPricePayload",
  fields: () => ({
    id: {
      type: GraphQLString
    },
    price: {
      type: GraphQLFloat
    }
  })
});

const schema = new GraphQLSchema({
  query: new GraphQLObjectType({
    name: "RootQueryType",
    fields: {
      odds: {
        type: GraphQLNonNull(GraphQLList(OddType)),
        resolve: async () => fetchData("oddsNew")
      }
    }
  }),
  subscription: new GraphQLObjectType({
    name: "Subscriptions",
    fields: {
      OddPrice: {
        type: OddPriceType,
        resolve: ({ odd }) => {
          return {
            id: odd.id,
            price: getRandomArbitrary(odd.price, odd.price + 10).toFixed(2)
          };
        },
        subscribe: () => pubsub.asyncIterator(EVENTS.ODD.PRICE)
      }
    }
  })
});

const server = new ApolloServer({ schema });

const app = new Koa();
const router = new Router();

app.use(cors());

router.all("/graphql");
router.all(
  "/playground",
  koaPlayground({
    endpoint: "/graphql",
    subscriptionsEndpoint: `ws://localhost:4000/subscriptions`
  })
);

app.use(router.routes()).use(router.allowedMethods());

server.applyMiddleware({ app });

const httpServer = app.listen(4000, async () => {
  console.log(`🚀 Server ready at http://localhost:4000${server.graphqlPath}`);
  console.log(
    `🚀 Subscriptions ready at ws://localhost:4000${server.subscriptionsPath}`
  );
});

server.installSubscriptionHandlers(httpServer);

setInterval(async () => {
  const result = await fetchData("oddsNew");
  try {
    result.map(odd => pubsub.publish(EVENTS.ODD.PRICE, { odd }));
  } catch ({ message }) {
    console.log("error: ", message);
  }
}, 5000);

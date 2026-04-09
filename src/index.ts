import dotenv from "dotenv";
dotenv.config();

import { ApolloServer } from "apollo-server";
import { typeDefs } from "./graphql/schema";
import { resolvers } from "./graphql/resolvers";
import { connectDB } from "./db/mongo";
import { getUserFromToken } from "./utils/auth";

const start = async () => {
  await connectDB();

  const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: async ({ req }) => {
      const authHeader = req.headers.authorization || "";
      const user = await getUserFromToken(authHeader);
      return { user };
    }
  });

  const port = process.env.PORT ? parseInt(process.env.PORT) : 3001;
  server.listen({ port }).then(({ url }) => {
    console.log(`Servidor operativo en ${url}`);
  });
};

start().catch(err => console.error("error de inicio:", err));

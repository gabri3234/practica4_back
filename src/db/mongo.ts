import { MongoClient, Db } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const MONGO_USER = process.env.MONGO_USER;
const MONGO_PASSWORD = process.env.MONGO_PASSWORD;
const CLUSTER = process.env.CLUSTER;
const CLUSTER_NAME = process.env.CLUSTER_NAME;

let client: MongoClient;
let db: Db;

export const connectDB = async (): Promise<Db> => {
  
  if (db) return db;

  try {
    
    const uri = `mongodb+srv://${MONGO_USER}:${MONGO_PASSWORD}@${CLUSTER}.ci3mp5c.mongodb.net/?retryWrites=true&w=majority&appName=${CLUSTER_NAME}`;

    client = new MongoClient(uri);
    await client.connect();
    db = client.db("practica4"); 
    
    console.log("Conectado a mongo Mamí");
    return db;

  } catch (error) {
    console.error(" Error al conectar a mongo:", error);
    process.exit(1); 
  }
};

export const getDB = (): Db => {
  if (!db) {
    throw new Error("no conectado rey.");
  }
  return db;
};
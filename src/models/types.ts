import { ObjectId } from "mongodb";

export interface IUser {
  _id?: ObjectId | string;
  username: string;
  email: string;
  password: string;
  createdAt?: Date;
}

export interface IProject {
  _id?: ObjectId | string;
  name: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  owner: string;  
  members: string[]; 
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ITask {
  _id?: ObjectId | string;
  title: string;
  projectId: string; 
  assignedTo?: string; 
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED";
  priority?: "LOW" | "MEDIUM" | "HIGH";
  dueDate?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}
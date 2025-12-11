import { IProject, IUser, ITask } from "../models/types";
import { getDB } from "../db/mongo";
import bcrypt from "bcryptjs";
import { signToken } from "../utils/auth";
import { ObjectId } from "mongodb";

export const resolvers = {
  Query: {
    users: async () => {
      const db = getDB();
      const users = await db.collection<IUser>("users").find().toArray();
      return users.map(u => ({ ...u, _id: u._id.toString(), createdAt: u.createdAt?.toISOString() }));
    },

    myProjects: async (_: any, __: any, context: { user?: IUser }) => {
      if (!context.user) throw new Error("Unauthorized");
      const db = getDB();
      const userId = context.user._id!;
      const projects = await db
        .collection<IProject>("projects")
        .find({ $or: [{ owner: userId.toString() }, { members: userId.toString() }] })
        .toArray();
      return projects.map(p => ({ ...p, _id: p._id.toString() }));
    },

    projectDetails: async (_: any, { projectId }: { projectId: string }) => {
      const db = getDB();
      const project = await db
        .collection<IProject>("projects")
        .findOne({ _id: new ObjectId(projectId) });
      if (!project) return null;

      const owner = await db
        .collection<IUser>("users")
        .findOne({ _id: new ObjectId(project.owner) });

      const members = await db
        .collection<IUser>("users")
        .find({ _id: { $in: project.members.map(id => new ObjectId(id)) } })
        .toArray();

      const tasks = await db
        .collection<ITask>("tasks")
        .find({ projectId })
        .toArray();

      return {
        ...project,
        _id: project._id.toString(),
        owner,
        members,
        tasks: tasks.map(t => ({ ...t, _id: t._id.toString() }))
      };
    }
  },

  Mutation: {
    register: async (_: any, { input }: { input: IUser }) => {
      const db = getDB();
      const hashed = await bcrypt.hash(input.password, 10);
      const now = new Date();
      const result = await db.collection<IUser>("users").insertOne({ ...input, password: hashed, createdAt: now });
      const user = { ...input, _id: result.insertedId.toString(), createdAt: now.toISOString() };
      const token = signToken({ id: user._id });
      return { token, user };
    },

    login: async (_: any, { input }: { input: { email: string; password: string } }) => {
      const db = getDB();
      const user = await db.collection<IUser>("users").findOne({ email: input.email });
      if (!user) throw new Error("Invalid credentials");

      const match = await bcrypt.compare(input.password, user.password);
      if (!match) throw new Error("Invalid credentials");

      const token = signToken({ id: user._id!.toString() });
      const { password, ...userSafe } = user;
      return { token, user: { ...userSafe, _id: userSafe._id.toString(), createdAt: userSafe.createdAt?.toISOString() } };
    },

    createProject: async (_: any, { input }: { input: IProject }, context: { user?: IUser }) => {
      if (!context.user) throw new Error("Unauthorized");
      const db = getDB();
      const now = new Date();
      const project: IProject = { ...input, owner: context.user._id!.toString(), members: [], createdAt: now, updatedAt: now };
      const result = await db.collection<IProject>("projects").insertOne(project);
      return { ...project, _id: result.insertedId.toString(), tasks: [] };
    },

    addMember: async (_: any, { projectId, userId }: { projectId: string; userId: string }, context: { user?: IUser }) => {
      if (!context.user) throw new Error("Unauthorized");
      const db = getDB();
      const project = await db.collection<IProject>("projects").findOne({ _id: new ObjectId(projectId) });
      if (!project) throw new Error("Project not found");
      if (project.owner !== context.user._id!.toString()) throw new Error("Only owner can add members");
      await db.collection<IProject>("projects").updateOne({ _id: new ObjectId(projectId) }, { $addToSet: { members: userId.toString() } });
      const updatedProject = await db.collection<IProject>("projects").findOne({ _id: new ObjectId(projectId) });
      return { ...updatedProject!, _id: updatedProject!._id.toString() };
    },

    createTask: async (_: any, { projectId, input }: { projectId: string; input: ITask }, context: { user?: IUser }) => {
      if (!context.user) throw new Error("Unauthorized");
      const db = getDB();
      const project = await db.collection<IProject>("projects").findOne({ _id: new ObjectId(projectId) });
      if (!project) throw new Error("Project not found");
      const userId = context.user._id!;
      if (project.owner !== userId.toString() && !project.members.includes(userId.toString())) throw new Error("Not allowed");

      const now = new Date();
      const task: ITask = { ...input, projectId, status: "PENDING", createdAt: now, updatedAt: now };
      const result = await db.collection<ITask>("tasks").insertOne(task);
      return { ...task, _id: result.insertedId.toString() };
    },

    updateTaskStatus: async (_: any, { taskId, status }: { taskId: string; status: "PENDING" | "IN_PROGRESS" | "COMPLETED" }) => {
      const db = getDB();
      await db.collection<ITask>("tasks").updateOne(
        { _id: new ObjectId(taskId) },
        { $set: { status, updatedAt: new Date() } }
      );
      const task = await db.collection<ITask>("tasks").findOne({ _id: new ObjectId(taskId) });
      return task ? { ...task, _id: task._id.toString() } : null;
    },

    updateProject: async (_: any, { id, input }: { id: string; input: Partial<IProject> }, context: { user?: IUser }) => {
      if (!context.user) throw new Error("Unauthorized");
      const db = getDB();
      const project = await db.collection<IProject>("projects").findOne({ _id: new ObjectId(id) });
      if (!project) throw new Error("Project not found");
      if (project.owner !== context.user._id!.toString()) throw new Error("Only owner can update project");
      await db.collection<IProject>("projects").updateOne(
        { _id: new ObjectId(id) },
        { $set: { ...input, updatedAt: new Date() } }
      );
      const updatedProject = await db.collection<IProject>("projects").findOne({ _id: new ObjectId(id) });
      return { ...updatedProject!, _id: updatedProject!._id.toString() };
    },

    deleteProject: async (_: any, { id }: { id: string }, context: { user?: IUser }) => {
      if (!context.user) throw new Error("Unauthorized");
      const db = getDB();
      const project = await db.collection<IProject>("projects").findOne({ _id: new ObjectId(id) });
      if (!project) throw new Error("Project not found");
      if (project.owner !== context.user._id!.toString()) throw new Error("Only owner can delete project");
      
      await db.collection<ITask>("tasks").deleteMany({ projectId: id });
      await db.collection<IProject>("projects").deleteOne({ _id: new ObjectId(id) });

      return true;
    }
  }
};

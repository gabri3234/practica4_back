import { gql } from "apollo-server";

export const typeDefs = gql`
  type User {
    _id: ID!
    username: String!
    email: String!
    createdAt: String
  }

  type Project {
    _id: ID!
    name: String!
    description: String
    startDate: String!
    endDate: String!
    owner: User!        # Owner siempre existe
    members: [User!]!
    tasks: [Task!]!     # Resolución dinámica
    createdAt: String
    updatedAt: String
  }

  type Task {
    _id: ID!
    title: String!
    projectId: ID!
    assignedTo: User
    status: String
    priority: String
    dueDate: String
    createdAt: String
    updatedAt: String
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  input RegisterInput {
    username: String!
    email: String!
    password: String!
  }

  input LoginInput {
    email: String!
    password: String!
  }

  input CreateProjectInput {
    name: String!
    description: String
    startDate: String!
    endDate: String!
  }

  # NUEVO INPUT PARA CUMPLIR ENUNCIADO
  input UpdateProjectInput {
    name: String
    description: String
    startDate: String
    endDate: String
  }

  input TaskInput {
    title: String!
    assignedTo: ID
    priority: String
    dueDate: String
  }

  enum TaskStatus {
    PENDING
    IN_PROGRESS
    COMPLETED
  }

  type Query {
    users: [User!]!
    myProjects: [Project!]!
    projectDetails(projectId: ID!): Project
  }

  type Mutation {
    register(input: RegisterInput!): AuthPayload
    login(input: LoginInput!): AuthPayload
    createProject(input: CreateProjectInput!): Project
    updateProject(id: ID!, input: UpdateProjectInput!): Project
    addMember(projectId: ID!, userId: ID!): Project
    createTask(projectId: ID!, input: TaskInput!): Task
    updateTaskStatus(taskId: ID!, status: TaskStatus!): Task
    deleteProject(id: ID!): Boolean
  }
`;
import { PrismaClient } from "@prisma/client";

export interface Context {
  prisma: PrismaClient;
}

export const context = {
  prisma: new PrismaClient(),
};

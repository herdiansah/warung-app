import request from 'supertest';
import startServer from '../../server';
import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

let appInstance: any;

export async function getApp() {
  if (!appInstance) {
    appInstance = await startServer();
  }
  return request(appInstance);
}

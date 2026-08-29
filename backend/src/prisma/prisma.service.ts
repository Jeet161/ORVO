import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    const connectionString = process.env.DATABASE_URL!;
    if (connectionString && connectionString.startsWith('postgresql')) {
      const pool = new Pool({ connectionString });
      const adapter = new PrismaNeon(pool as any);
      super({ adapter: adapter as any });
    } else {
      super();
    }
  }

  async onModuleInit() {
    await this.$connect();
  }
}

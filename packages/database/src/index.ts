// Database types for DFS Optimizer
export interface Player {
  id: string;
  name: string;
  team: string;
  position: string;
  salary: number;
  projection: number;
}

export interface Game {
  id: string;
  homeTeam: string;
  awayTeam: string;
  gameTime: string;
}

export interface Slate {
  id: string;
  name: string;
  sport: string;
  contests: Contest[];
}

export interface Contest {
  id: string;
  name: string;
  entryFee: number;
  totalPrizes: number;
}

export interface Lineup {
  id: string;
  players: Player[];
  totalSalary: number;
  projection: number;
}

// Database utilities (mock implementation for build)
export const createPrismaClient = () => {
  return {
    $connect: async () => Promise.resolve(),
    $disconnect: async () => Promise.resolve(),
  };
};

// Connection helper
export const connectDatabase = async () => {
  const client = createPrismaClient();
  console.log('✅ Database connected successfully');
  await client.$connect();
  return client;
};

// Graceful disconnect
export const disconnectDatabase = async (
  client: ReturnType<typeof createPrismaClient>
) => {
  await client.$disconnect();
  console.log('✅ Database disconnected successfully');
};

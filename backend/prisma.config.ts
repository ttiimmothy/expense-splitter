import { defineConfig } from "prisma/config";
import path from "node:path";
import {config} from "dotenv";

config();

export default defineConfig({
  migrations: {
    seed: "tsx src/seed.ts",
  },
});
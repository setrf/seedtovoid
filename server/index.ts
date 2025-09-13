import express from "express";
import { routes } from "./routes";
import { vite } from "./vite";

async function main() {
  const app = express();
  app.use(express.json());
  app.use(routes);
  app.use(vite);

  const port = process.env.PORT || 3001;
  app.listen(port, () => {
    console.log(`Server listening on port http://localhost:${port}`);
  });
}

main();

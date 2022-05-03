import { Application, Router } from 'https://deno.land/x/oak/mod.ts';
import { oakCors } from "https://deno.land/x/cors/mod.ts";
import { loadLibraries } from "./src/utils/loadLibraries.ts";
import * as controller from './src/controller.ts';
import { config } from "https://deno.land/std@0.128.0/dotenv/mod.ts";

await loadLibraries();

const app = new Application;
const router = new Router;

router.get('/libraries', controller.getLibraries);
router.post('/cmake', controller.getCmake);
router.post('/cpp', controller.getCppFiles);
router.post('/compatible', controller.getCompatibility);

app.use(oakCors());
app.use(router.routes());

console.log(`Starting server on port ${(await config()).PORT}...`);

await app.listen({ port: parseInt((await config()).PORT) });

export default app;

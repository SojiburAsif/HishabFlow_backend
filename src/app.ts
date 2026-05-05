import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { IndexRoutes } from './app/routes';
import { notFound } from './app/middlewares/notFound';
import { globalErrorHandler } from './app/middlewares/globalErrorHandler';
import { envVars } from './app/config/env';

const app: Application = express();

// parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors({
  origin: envVars.BETTER_AUTH_URL,
  credentials: true,
}));

// application routes
app.use("/api/v1", IndexRoutes);

app.get('/', (req: Request, res: Response) => {
  res.send('Hello from HishabFlow API');
});

app.use(notFound);
app.use(globalErrorHandler);

export default app;

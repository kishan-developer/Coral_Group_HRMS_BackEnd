import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

import cookieParser from 'cookie-parser';

import routes from './routes';
import v1Routes from './routes/v1';
import {
  errorMiddleware,
  notFoundMiddleware,
} from './middleware/error.middleware';

dotenv.config();

const app: Application = express();

app.use(helmet());

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'HRMS API Running',
  });
});

app.use('/api/v1', v1Routes);
app.use('/v1', v1Routes);
app.use('/api', routes);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;
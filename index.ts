import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import { useKdxDevData } from './apis/kdx-dev-data';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors({
  origin: true,
  credentials: true,
}));

app.use(cookieParser());

app.use(express.static('public'));

useKdxDevData(app);

app.listen(3100, () => {
  console.log('Start on port 3100.');
})


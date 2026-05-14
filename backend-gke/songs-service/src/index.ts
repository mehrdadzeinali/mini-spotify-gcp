import express from 'express';
import cors from 'cors';
import songsRouter from './routes/songs';
import { verifyToken } from './middleware/auth';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'songs-service' });
});

app.get('/', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/songs', verifyToken, songsRouter);

app.listen(PORT, () => {
  console.log(`Songs service running on port ${PORT}`);
});

import express from 'express';
import cors from 'cors';
import playlistsRouter from './routes/playlists';
import { verifyToken } from './middleware/auth';

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'playlists-service' });
});

app.get('/', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/playlists', verifyToken, playlistsRouter);

app.listen(PORT, () => {
  console.log(`Playlists service running on port ${PORT}`);
});

import express from 'express';
import cors from 'cors';
import songsRouter from './routes/songs';
import playlistsRouter from './routes/playlists';

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/songs', songsRouter);
app.use('/playlists', playlistsRouter);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
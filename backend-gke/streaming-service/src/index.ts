import express from 'express';
import cors from 'cors';
import streamingRouter from './routes/streaming';
import { verifyToken } from './middleware/auth';

const app = express();
const PORT = process.env.PORT || 3003;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'streaming-service' });
});

app.use('/streaming', verifyToken, streamingRouter);

app.listen(PORT, () => {
  console.log(`Streaming service running on port ${PORT}`);
});

import { Router } from 'express';
import firestore from '../firestore';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { search, genre, limit = '20', offset = '0' } = req.query;

    let query: FirebaseFirestore.Query = firestore.collection('songs');

    if (genre) {
      query = query.where('genre', '==', genre);
    }

    const snapshot = await query.limit(parseInt(limit as string)).get();
    let songs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    if (search) {
      const term = (search as string).toLowerCase();
      songs = songs.filter((s: any) =>
        s.title.toLowerCase().includes(term) ||
        s.artist.toLowerCase().includes(term)
      );
    }

    res.json(songs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: String(error) });
  }
});

router.get('/genres', async (req, res) => {
  try {
    const snapshot = await firestore.collection('songs').get();
    const genres = [...new Set(snapshot.docs.map(doc => doc.data()['genre']).filter(Boolean))];
    res.json(genres);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

export default router;

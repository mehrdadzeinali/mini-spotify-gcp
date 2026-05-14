import { Router } from 'express';
import firestore from '../firestore';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const snapshot = await firestore.collection('playlists').get();
    const playlists = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    res.json(playlists);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch playlists' });
  }
});

export default router;

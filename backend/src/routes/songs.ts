import { Router } from 'express';
import firestore from '../firestore';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const snapshot = await firestore.collection('songs').get();
    const songs = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    res.json(songs);
  } catch (error) {
    console.error('Firestore error:', error);
    res.status(500).json({ error: String(error) });
  }
});

export default router;
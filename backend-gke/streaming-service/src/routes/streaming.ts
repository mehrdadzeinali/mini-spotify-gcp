import { Router } from 'express';
import firestore from '../firestore';
import { publishEvent } from '../pubsub';

const router = Router();

// Track a play event
router.post('/play', async (req, res) => {
  try {
    const userId = (req as any).user.uid;
    const { songId, title, artist, genre } = req.body;

    await publishEvent('PLAY', { userId, songId, title, artist, genre });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

// Track a skip event
router.post('/skip', async (req, res) => {
  try {
    const userId = (req as any).user.uid;
    const { songId } = req.body;

    await publishEvent('SKIP', { userId, songId });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

// Like a song
router.post('/like', async (req, res) => {
  try {
    const userId = (req as any).user.uid;
    const { songId } = req.body;

    await publishEvent('LIKE', { userId, songId });

    await firestore.collection('likes').doc(`${userId}_${songId}`).set({
      userId,
      songId,
      createdAt: new Date().toISOString()
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

// Get liked songs for current user
router.get('/likes', async (req, res) => {
  try {
    const userId = (req as any).user.uid;
    const snapshot = await firestore
      .collection('likes')
      .where('userId', '==', userId)
      .get();

    const likes = snapshot.docs.map(doc => doc.data()['songId']);
    res.json(likes);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

// Unlike a song
router.delete('/like/:songId', async (req, res) => {
  try {
    const userId = (req as any).user.uid;
    const { songId } = req.params;

    await firestore.collection('likes').doc(`${userId}_${songId}`).delete();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

export default router;

import { Router } from 'express';
import firestore from '../firestore';

const router = Router();

// Get all playlists for the current user
router.get('/', async (req, res) => {
  try {
    const userId = (req as any).user.uid;
    const snapshot = await firestore
      .collection('playlists')
      .where('userId', '==', userId)
      .get();

    const playlists = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(playlists);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

// Create a new playlist
router.post('/', async (req, res) => {
  try {
    const userId = (req as any).user.uid;
    const { name } = req.body;

    const playlist = {
      name,
      userId,
      songs: [],
      createdAt: new Date().toISOString()
    };

    const ref = await firestore.collection('playlists').add(playlist);
    res.json({ id: ref.id, ...playlist });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

// Add a song to a playlist
router.post('/:id/songs', async (req, res) => {
  try {
    const { id } = req.params;
    const { songId } = req.body;

    const ref = firestore.collection('playlists').doc(id);
    const doc = await ref.get();

    if (!doc.exists) {
      res.status(404).json({ error: 'Playlist not found' });
      return;
    }

    const songs = doc.data()?.songs || [];
    await ref.update({ songs: [...songs, songId] });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

// Delete a playlist
router.delete('/:id', async (req, res) => {
  try {
    await firestore.collection('playlists').doc(req.params.id).delete();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

export default router;

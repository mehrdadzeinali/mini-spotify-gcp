import { Router } from 'express';
import firestore from '../firestore';
import { BigQuery } from '@google-cloud/bigquery';

const router = Router();
const bigquery = new BigQuery({ projectId: 'mini-spotify-gcp' });

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

router.get('/trending', async (req, res) => {
  try {
    const [rows] = await bigquery.query(`
      SELECT songId, title, artist, genre, COUNT(*) as plays
      FROM \`mini-spotify-gcp.wavely_analytics.play_events\`
      WHERE eventType = 'PLAY'
      GROUP BY songId, title, artist, genre
      ORDER BY plays DESC
      LIMIT 20
    `);

    // Enrich with Firestore data to get cover URLs
    const enriched = await Promise.all(rows.map(async (row: any) => {
      const doc = await firestore.collection('songs').doc(row.songId).get();
      const firestoreData = doc.exists ? doc.data() : {};
      return { id: row.songId, ...firestoreData, plays: row.plays };
    }));

    res.json(enriched);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: String(error) });
  }
});

router.get('/recommendations/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const [rows] = await bigquery.query(`
      SELECT genre, COUNT(*) as plays
      FROM \`mini-spotify-gcp.wavely_analytics.play_events\`
      WHERE userId = '${userId}' AND eventType = 'PLAY'
      GROUP BY genre
      ORDER BY plays DESC
      LIMIT 3
    `);

    const topGenres = rows.map((r: any) => r.genre);

    if (topGenres.length === 0) {
      const snapshot = await firestore.collection('songs').limit(10).get();
      return res.json(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }

    // Fetch songs per genre in preference order
    const allSongs: any[] = [];
    for (const genre of topGenres) {
      const snapshot = await firestore.collection('songs')
        .where('genre', '==', genre)
        .limit(10)
        .get();
      const songs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Shuffle within each genre for variety
      allSongs.push(...songs.sort(() => Math.random() - 0.5));
    }

    res.json(allSongs.slice(0, 20));
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

export default router;

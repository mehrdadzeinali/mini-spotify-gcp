import { Firestore } from '@google-cloud/firestore';

const firestore = new Firestore({
  projectId: 'mini-spotify-gcp'
});

export default firestore;

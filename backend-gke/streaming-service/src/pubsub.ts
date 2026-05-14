import { PubSub } from '@google-cloud/pubsub';

const pubsub = new PubSub({
  projectId: 'mini-spotify-gcp'
});

export const publishEvent = async (eventType: string, data: object) => {
  const topicName = 'wavely-play-events';
  const message = {
    eventType,
    timestamp: new Date().toISOString(),
    ...data
  };

  await pubsub.topic(topicName).publishMessage({
    data: Buffer.from(JSON.stringify(message))
  });
};

export default pubsub;
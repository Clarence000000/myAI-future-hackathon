import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';

admin.initializeApp();
const db = admin.firestore();

export const onThreatLogCreated = onDocumentCreated('threats/{docId}', async (event) => {
  const snapshot = event.data;
  if (!snapshot) {
    logger.info("No data associated with the event");
    return;
  }

  const data = snapshot.data();
  const { riskLevel, category, sourceUrl } = data;
  const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const statsRef = db.collection('stats').doc(date);

  // 1. Update daily stats counters
  const increment = admin.firestore.FieldValue.increment(1);
  const updateData: Record<string, any> = { total: increment };
  
  if (category === 'Phishing') updateData.phishing = increment;
  else if (category === 'Mule Request') updateData.muleRequest = increment;
  else if (category === 'Fake Promo') updateData.fakePromo = increment;

  await statsRef.set(updateData, { merge: true });
  logger.info(`Updated stats for ${date}`);

  if (riskLevel === 'HIGH' && sourceUrl) {
     logger.info(`Threat ${event.params.docId} is HIGH risk with URL: ${sourceUrl}`);
  }
});

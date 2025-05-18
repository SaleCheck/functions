require('dotenv').config();
const assert = require('assert');
const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');

if (!process.env.FIRESTORE_EMULATOR_HOST) throw new Error('FIRESTORE_EMULATOR_HOST is not set');
if (!admin.apps.length) admin.initializeApp({ projectId: process.env.PROJECT_ID })
// if (!admin.apps.length) {
//   admin.initializeApp({
//     projectId: 'demo-test-project' //requires: firebase emulators:start --only firestore --project demo-test-project
//   });
// }

const db = getFirestore();
db.settings({ host: process.env.FIRESTORE_EMULATOR_HOST, ssl: false });

describe('Firestore Emulator', () => {
 it('writes and reads a document', async () => {
   const ref = db.collection('test').doc('hello');
   await ref.set({ foo: 'bar' });
  
   const snap = await ref.get();
  
   assert.strictEqual(snap.exists, true);
   assert.strictEqual(snap.data().foo, 'bar');
 }).timeout(15000);
});


const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');
const { Timestamp } = require('firebase-admin/firestore');

const db = admin.firestore();

async function onUserCreatedCopyToFirestore(user) {
  const userData = {
    createdOn: Timestamp.now() ?? null,
    disabled: user.disabled ?? null,
    displayName: user.displayName ?? null,
    email: user.email ?? null,
    emailVerified: user.emailVerified ?? null,
    firstName: user.firstName ?? null,
    lastName: user.lastName ?? null,
    lastUpdated: Timestamp.now() ?? null,
    phoneNumber: user.phoneNumber ?? null,
    photoURL: user.photoURL ?? null,
    uid: user.uid ?? null,
  };

  const docRef = db.collection('users').doc(user.uid);
  await docRef.set(userData);

  return userData;
}

// Firebase trigger (thin wrapper)
exports.onUserCreatedCopyToFirestore = functions.auth
  .user()
  .onCreate(async (user) => {
    console.log('User created:', user.uid);
    return onUserCreatedCopyToFirestore(user);
  });

// Export for testing
module.exports.onUserCreatedCopyToFirestore = onUserCreatedCopyToFirestore;

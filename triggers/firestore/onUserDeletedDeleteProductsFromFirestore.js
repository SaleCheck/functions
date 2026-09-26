const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');

const db = admin.firestore();

async function deleteUserProducts(userId) {
  const snapshot = await db
    .collection('productsToCheck')
    .where('user', '==', userId)
    .get();

  if (snapshot.empty) {
    return;
  }

  const batch = db.batch();
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });

  await batch.commit();
}

// Firestore trigger for document deletion in 'users' collection
exports.onUserDeletedDeleteProductsFromFirestore = functions.firestore
  .document('users/{userId}')
  .onDelete(async (snap, context) => {
    const userId = context.params.userId;
    console.log(`User document deleted in Firestore: ${userId}`);

    try {
      await deleteUserProducts(userId);
      console.log(`Successfully deleted products for user: ${userId}`);
    } catch (error) {
      console.error(
        `Error deleting products for deleted user ${userId}:`,
        error
      );
    }
  });

// Export for testing
exports._test = { deleteUserProducts };

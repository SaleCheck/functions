const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');

const db = admin.firestore();

async function deleteUserProducts(userId) {
  const snapshot = await db
    .collection('productsToCheck')
    .where('user', '==', userId)
    .get();

  if (snapshot.empty) return { count: 0, deletedIds: [] };

  const batch = db.batch();
  const deletedIds = [];

  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
    deletedIds.push(doc.id);
  });

  await batch.commit();

  return {
    count: deletedIds.length,
    deletedIds,
  };
}

// Firestore trigger for document deletion in 'users' collection
exports.onUserDeletedDeleteProductsFromFirestore = functions.firestore
  .document('users/{userId}')
  .onDelete(async (snap, context) => {
    const userId = context.params.userId;
    console.log(`User document deleted in Firestore: ${userId}`);

    try {
      const { count, deletedIds } = await deleteUserProducts(userId);

      console.log(
        `Successfully deleted ${count} product(s) for user: ${userId}`
      );
      if (count > 0)
        console.log(`Deleted Product IDs:\n${deletedIds.join('\n')}`);
    } catch (error) {
      console.error(
        `Error deleting products for deleted user ${userId}:`,
        error
      );
    }
  });

// Export for testing
exports._test = { deleteUserProducts };

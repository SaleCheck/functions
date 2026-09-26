const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');

// const db = admin.firestore();
const bucket = admin.storage().bucket();

async function deleteProductData(productId) {
  // Path prefix for the product's directory in Storage
  const folderPath = `productImages/${productId}/`;

  // Deletes all files and the directory under this prefix
  await bucket.deleteFiles({ prefix: folderPath });
}

// Firestore trigger for document deletion
exports.onProductDeletedDeleteFromStorage = functions.firestore
  .document('productsToCheck/{productId}')
  .onDelete(async (snap, context) => {
    const productId = context.params.productId;
    console.log(`Product deleted: ${productId}`);

    try {
      await deleteProductData(productId);
    } catch (error) {
      console.error(
        `Error deleting storage files for product ${productId}:`,
        error
      );
    }
  });

// Export for testing
exports._test = { deleteProductData };

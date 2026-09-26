const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');

const bucket = admin.storage().bucket();

async function deleteProductData(productId) {
  const folderPath = `productImages/${productId}/`;

  // Get files matching the prefix before deletion to retrieve their names
  const [files] = await bucket.getFiles({ prefix: folderPath });

  if (files.length === 0) return { count: 0, deletedFiles: [] };

  const deletedFiles = files.map((file) => file.name);

  await bucket.deleteFiles({ prefix: folderPath });

  return {
    count: deletedFiles.length,
    deletedFiles,
  };
}

// Firestore trigger for document deletion in 'productsToCheck' collection
exports.onProductDeletedDeleteFromStorage = functions.firestore
  .document('productsToCheck/{productId}')
  .onDelete(async (snap, context) => {
    const productId = context.params.productId;
    console.log(`Product deleted: ${productId}`);

    try {
      const { count, deletedFiles } = await deleteProductData(productId);

      console.log(
        `Successfully deleted ${count} storage file(s) for product: ${productId}`
      );
      if (count > 0)
        console.log(`Deleted File Paths:\n${deletedFiles.join('\n')}`);
    } catch (error) {
      console.error(
        `Error deleting storage files for product ${productId}:`,
        error
      );
    }
  });

// Export for testing
exports._test = { deleteProductData };

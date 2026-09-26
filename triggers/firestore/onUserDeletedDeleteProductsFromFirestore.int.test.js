const { getFirestore } = require('firebase-admin/firestore');
const { expect } = require('chai');
const { _test } = require('./onUserDeletedDeleteProductsFromFirestore');

const db = getFirestore();

exports.onUserDeletedDeleteProductsFromFirestoreIntTest = () => {
  describe('onUserDeletedDeleteProductsFromFirestore', function () {
    this.timeout(10000);

    const testUserId = 'test-user-delete-products-123';
    const otherUserId = 'other-user-456';

    const testProductId1 = 'test-product-doc-1';
    const testProductId2 = 'test-product-doc-2';
    const otherProductId = 'other-user-product-doc';

    // Helper to seed a product document in Firestore
    async function createTestProductDoc(productId, userId) {
      const docRef = db.collection('productsToCheck').doc(productId);
      await docRef.set({
        title: `Test Product ${productId}`,
        user: userId,
        createdAt: new Date(),
      });
      return docRef;
    }

    // Clean up test documents after each test
    afterEach(async () => {
      const docsToDelete = [testProductId1, testProductId2, otherProductId];
      const batch = db.batch();

      docsToDelete.forEach((id) => {
        batch.delete(db.collection('productsToCheck').doc(id));
      });

      await batch.commit();
    });

    it('should delete all products in productsToCheck matching the deleted user ID', async () => {
      // 1. Seed product documents for the user
      await createTestProductDoc(testProductId1, testUserId);
      await createTestProductDoc(testProductId2, testUserId);

      // Verify documents exist before deletion
      const doc1Before = await db
        .collection('productsToCheck')
        .doc(testProductId1)
        .get();
      const doc2Before = await db
        .collection('productsToCheck')
        .doc(testProductId2)
        .get();

      expect(doc1Before.exists).to.be.true;
      expect(doc2Before.exists).to.be.true;

      // 2. Invoke the function
      await _test.deleteUserProducts(testUserId);

      // 3. Assert documents are deleted
      const doc1After = await db
        .collection('productsToCheck')
        .doc(testProductId1)
        .get();
      const doc2After = await db
        .collection('productsToCheck')
        .doc(testProductId2)
        .get();

      expect(doc1After.exists).to.be.false;
      expect(doc2After.exists).to.be.false;
    });

    it('should only delete products belonging to the specified user and leave others intact', async () => {
      // 1. Seed products for target user and another user
      await createTestProductDoc(testProductId1, testUserId);
      await createTestProductDoc(otherProductId, otherUserId);

      // 2. Invoke deletion for target user
      await _test.deleteUserProducts(testUserId);

      // 3. Assert target user product is deleted, but other user product remains
      const targetDoc = await db
        .collection('productsToCheck')
        .doc(testProductId1)
        .get();
      const otherDoc = await db
        .collection('productsToCheck')
        .doc(otherProductId)
        .get();

      expect(targetDoc.exists).to.be.false;
      expect(otherDoc.exists).to.be.true;
      expect(otherDoc.data().user).to.equal(otherUserId);
    });

    it('should execute gracefully without throwing if the user has no products', async () => {
      const userWithNoProducts = 'user-without-products-999';

      let errorThrown = false;
      try {
        await _test.deleteUserProducts(userWithNoProducts);
      } catch {
        errorThrown = true;
      }

      expect(errorThrown).to.be.false;
    });
  });
};

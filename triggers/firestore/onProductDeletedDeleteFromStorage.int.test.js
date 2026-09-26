const { getStorage } = require('firebase-admin/storage');
const { expect } = require('chai');
const { _test } = require('./onProductDeletedDeleteFromStorage');

const storage = getStorage();
const bucket = storage.bucket();

exports.onProductDeletedDeleteFromStorageIntTest = () => {
  describe('onProductDeletedDeleteFromStorage', function () {
    this.timeout(10000);

    const testProductId = 'test-product-12345';
    const folderPath = `productImages/${testProductId}/`;
    const testFilePath = `${folderPath}${testProductId}.jpeg`;

    // Helper to upload a dummy file to the emulator/storage
    async function createTestImage(path) {
      const file = bucket.file(path);
      await file.save('fake-image-binary-data', {
        contentType: 'image/jpeg',
      });
      return file;
    }

    // Ensure clean state before each test
    beforeEach(async () => {
      await bucket.deleteFiles({ prefix: folderPath });
    });

    // Cleanup storage files after each test
    afterEach(async () => {
      await bucket.deleteFiles({ prefix: folderPath });
    });

    it('should delete all image files in storage under the productImages folder', async () => {
      // 1. Create test file in storage
      await createTestImage(testFilePath);

      // Verify file exists before running the test
      const [existsBefore] = await bucket.file(testFilePath).exists();
      expect(existsBefore).to.be.true;

      // 2. Call the underlying function
      await _test.deleteProductData(testProductId);

      // 3. Assert file no longer exists
      const [existsAfter] = await bucket.file(testFilePath).exists();
      expect(existsAfter).to.be.false;
    });

    it('should delete multiple image files inside the same product directory', async () => {
      const secondFilePath = `${folderPath}secondary-image.png`;

      await createTestImage(testFilePath);
      await createTestImage(secondFilePath);

      const [filesBefore] = await bucket.getFiles({ prefix: folderPath });
      expect(filesBefore).to.have.lengthOf(2);

      await _test.deleteProductData(testProductId);

      const [filesAfter] = await bucket.getFiles({ prefix: folderPath });
      expect(filesAfter).to.have.lengthOf(0);
    });

    it('should resolve gracefully without throwing if the product folder does not exist', async () => {
      const nonExistentProductId = 'non-existent-product-99999';

      // Should complete without throwing an error
      let errorThrown = false;
      try {
        await _test.deleteProductData(nonExistentProductId);
      } catch {
        errorThrown = true;
      }

      expect(errorThrown).to.be.false;
    });
  });
};

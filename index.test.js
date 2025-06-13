const fs = require('fs');
const path = require('path');
const { expect } = require('chai');

const firebaseConfig = require('../firebase.json');
if (firebaseConfig.emulators && firebaseConfig.emulators.firestore) process.env.FIRESTORE_EMULATOR_HOST = `localhost:${firebaseConfig.emulators.firestore.port}`;
if (firebaseConfig.emulators && firebaseConfig.emulators.auth) process.env.FIREBASE_AUTH_EMULATOR_HOST = `localhost:${firebaseConfig.emulators.auth.port}`;
if (firebaseConfig.emulators && firebaseConfig.emulators.storage) process.env.FIREBASE_STORAGE_EMULATOR_HOST = `localhost:${firebaseConfig.emulators.storage.port}`;

if (!process.env.FIRESTORE_EMULATOR_HOST) throw new Error('FIRESTORE_EMULATOR_HOST is not set');
if (!process.env.FIREBASE_AUTH_EMULATOR_HOST) throw new Error('FIREBASE_AUTH_EMULATOR_HOST is not set');
if (!process.env.FIREBASE_STORAGE_EMULATOR_HOST) throw new Error('FIREBASE_STORAGE_EMULATOR_HOST is not set');

const admin = require('firebase-admin');
if (!admin.apps.length) {
    admin.initializeApp({
        projectId: process.env.PROJECT_ID,
        storageBucket: process.env.STORAGE_BUCKET
    });
}

const { createProductToCheckIntTest } = require('./firestore/products/createProductToCheck.int.test');
const { getProductToCheckIntTest } = require('./firestore/products/getProductToCheck.int.test');
const { updateProductToCheckIntTest } = require('./firestore/products/updateProductToCheck.int.test');
const { deleteProductToCheckIntTest } = require('./firestore/products/deleteProductToCheck.int.test');

const { copyUserObjectToFirestoreIntTest } = require('./firestore/users/copyUserObjectToFirestore.int.test');
const { deleteUserObjectFromFirestoreIntTest } = require('./firestore/users/deleteUserObjectFromFirestore.int.test');

const { createUserIntTest } = require('./auth/createUser.int.test');
const { getUserIntTest } = require('./auth/getUser.int.test');
const { updateUserIntTest } = require('./auth/updateUser.int.test');
const { deleteUserIntTest } = require('./auth/deleteUser.int.test');

createProductToCheckIntTest();
getProductToCheckIntTest();
updateProductToCheckIntTest();
deleteProductToCheckIntTest();

copyUserObjectToFirestoreIntTest();
deleteUserObjectFromFirestoreIntTest();

createUserIntTest();
getUserIntTest();
updateUserIntTest();
deleteUserIntTest();


describe('All exported functions in index.js have corresponding *IntTest in index.test.js', function () {
    const indexExports = require('./index.js');
    const testFilePath = path.join(__dirname, 'index.test.js');
    const testFileContent = fs.readFileSync(testFilePath, 'utf-8');

    /* Temporary additions - Configure functions allowed to skip test: */
    const skipFunctions = [
        'scrapeAndComparePricesOnRequest',
        'scrapeAndComparePricesOnSchedule',
        'onProductSaleCheckExecution',
        'testPuppeteer'
    ];
    
    Object.keys(indexExports).forEach((exportName) => {
        if (skipFunctions.includes(exportName)) return; // <-- Temporary additions - Configure functions allowed to skip test
        
        const expectedTestFnName = `${exportName}IntTest`;
        it(`should have ${expectedTestFnName} defined and called in index.test.js`, function () {
            const isCalled = testFileContent.includes(`${expectedTestFnName}(`) || testFileContent.includes(`${expectedTestFnName}();`);
            expect(isCalled, `${expectedTestFnName} is missing or not called`).to.be.true;
        });
    });
});

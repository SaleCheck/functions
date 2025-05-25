const admin = require('firebase-admin');
const firebaseConfig = require('../firebase.json');

if (!process.env.FIRESTORE_EMULATOR_HOST) throw new Error('FIRESTORE_EMULATOR_HOST is not set');
if (firebaseConfig.emulators && firebaseConfig.emulators.storage) {
    process.env.FIREBASE_STORAGE_EMULATOR_HOST = `localhost:${firebaseConfig.emulators.storage.port}`;
}
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

createProductToCheckIntTest();
getProductToCheckIntTest();
updateProductToCheckIntTest();
deleteProductToCheckIntTest();
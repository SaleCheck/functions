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

const { createUserIntTest } = require('./auth/createUser.int.test');
const { getUserIntTest } = require('./auth/getUser.int.test');
const { deleteUserIntTest } = require('./auth/deleteUser.int.test');

createProductToCheckIntTest();
getProductToCheckIntTest();
updateProductToCheckIntTest();
deleteProductToCheckIntTest();

createUserIntTest();
getUserIntTest();
deleteUserIntTest();
require('dotenv').config();
const admin = require('firebase-admin');
const { initializeApp } = require('firebase/app');
const { initializeApp: initializeAdminApp } = require("firebase-admin/app");

const firebaseConfig = {
    apiKey: process.env.API_KEY,
    authDomain: process.env.AUTH_DOMAIN,
    projectId: process.env.PROJECT_ID,
    storageBucket: process.env.STORAGE_BUCKET,
    messagingSenderId: process.env.MESSAGING_SENDER_ID,
    appId: process.env.APP_ID,
    measurementId: process.env.MEASUREMENT_ID
};
initializeApp(firebaseConfig);
if (!admin.apps.length) initializeAdminApp();


const {
    scrapeAndComparePricesOnRequest,
    scrapeAndComparePricesOnSchedule
} = require('./productPrices/scrapeAndComparePrices');
const onProductSaleCheckExecution = require('./productPrices/onProductSaleCheckExecution');
const testPuppeteer = require('./utils/testPuppeteer');

const createProductToCheck = require('./firestore/products/createProductToCheck');
const getProductToCheck = require('./firestore/products/getProductToCheck');
const updateProductToCheck = require('./firestore/products/updateProductToCheck');
const deleteProductToCheck = require('./firestore/products/deleteProductToCheck');

const copyUserObjectToFirestore = require('./firestore/users/copyUserObjectToFirestore');
const deleteUserObjectFromFirestore = require('./firestore/users/deleteUserObjectFromFirestore');

const createUser = require('./auth/createUser');
const getUser = require('./auth/getUser');
const updateUser = require('./auth/updateUser');
const deleteUser = require('./auth/deleteUser');


exports.scrapeAndComparePricesOnRequest = scrapeAndComparePricesOnRequest;
exports.scrapeAndComparePricesOnSchedule = scrapeAndComparePricesOnSchedule;
exports.onProductSaleCheckExecution = onProductSaleCheckExecution.onProductSaleCheckExecution;
exports.testPuppeteer = testPuppeteer.testPuppeteer;

exports.createProductToCheck = createProductToCheck.createProductToCheck;
exports.getProductToCheck = getProductToCheck.getProductToCheck;
exports.updateProductToCheck = updateProductToCheck.updateProductToCheck;
exports.deleteProductToCheck = deleteProductToCheck.deleteProductToCheck;

exports.copyUserObjectToFirestore = copyUserObjectToFirestore.copyUserObjectToFirestore;
exports.deleteUserObjectFromFirestore = deleteUserObjectFromFirestore.deleteUserObjectFromFirestore;

exports.createUser = createUser.createUser;
exports.getUser = getUser.getUser;
exports.updateUser = updateUser.updateUser;
exports.deleteUser = deleteUser.deleteUser;
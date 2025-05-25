const { createProductToCheckIntTest } = require('./firestore/products/createProductToCheck.int.test');
const { getProductToCheckIntTest } = require('./firestore/products/getProductToCheck.int.test');
const { updateProductToCheckIntTest } = require('./firestore/products/updateProductToCheck.int.test');
const { deleteProductToCheckIntTest } = require('./firestore/products/deleteProductToCheck.int.test');

createProductToCheckIntTest();
getProductToCheckIntTest();
updateProductToCheckIntTest();
deleteProductToCheckIntTest();
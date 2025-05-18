require('dotenv').config();
const {
    expect,
    assert
} = require('chai');

const test = require("firebase-functions-test")();

// const myFunctions = require("../index.js");
const wrap = test.wrap;


// describe('Environment and function loading', () => {
//   it('should load environment variables and functions', () => {
//     expect(process.env.PROJECT_ID).to.exist;
//     expect(process.env.STORAGE_BUCKET).to.exist;
//     // expect(myFunctions).to.exist;
//   });
// });


  
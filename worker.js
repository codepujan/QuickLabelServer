var fs = require('fs');
var express = require('express');
var serveStatic = require('serve-static');
var path = require('path');
var morgan = require('morgan');
var healthChecker = require('sc-framework-health-check');
var jpeg = require('jpeg-js');
let sp;
var globalSocket;


let changeOperatingImage="CHANGE_OPERATING_IMAGE";

const Promise = require('bluebird');
const  promiseFs=Promise.promisifyAll(require('fs'));

//This needs to be  moved somewhere else into some other module 
//const mslearn=require('../../../meanshiftseg/MSlearn/cpp/build/Release/mslearn');
var cachedCurrentImage;  // So That We don't need to pack and send two images from the client side 
// This  will be  incremental based on the actions we will be taking 


//SC_REDUCER PART 
import createStore from './store';

var {Operation}=require('./operationClass');

module.exports.run = function (worker) {

let storeReference;

let operationObject;

  console.log('   >> Worker PID:', process.pid);
  var environment = worker.options.environment;

  var app = express();


  var httpServer = worker.httpServer;
  var scServer = worker.scServer;

  if (environment == 'dev') {
    // Log every HTTP request. See https://github.com/expressjs/morgan for other
    // available formats.
    app.use(morgan('dev'));
  }
  app.use(serveStatic(path.resolve(__dirname, 'public')));

  // Add GET /health-check express route
  healthChecker.attach(worker, app);

  httpServer.on('request', app);

  var count = 0;

const exchange=worker.exchange;


//SC_REDUX PART 
scServer.on('connection', socket => {
storeReference=createStore(socket, exchange);
operationObject=new Operation();
module.exports.operationObject=operationObject;
module.exports.storeReference=storeReference;

console.log("Someone Connected with me ");
})

}





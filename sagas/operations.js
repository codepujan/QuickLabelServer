var fs = require('fs');
import {call, cps, take, put, fork } from 'redux-saga/effects'
import { socketEmit, createChannelSubscription } from 'redux-saga-sc'

const Promise = require('bluebird');

import utility from '../utility'

let sizeOf=require('image-size');


import storeReference from '../worker';


let changeOperatingImage="CHANGE_OPERATING_IMAGE";
let storespCache="STORE_SP_CACHE";



async function apiRectangleSegmented(sps,tly,tlx,bry,brx,rgb,label,sp){
//sth else stuff 
  return await utility.applyRectangleOperation(sps,tly,tlx,bry,brx,rgb,label,sp);
};

async function justLoadImage(userId,datasetId,imageId,sp){

return await utility.justLoadImage(userId,datasetId,imageId,sp);

}
function apiloadSp(dispatcher,img,sp){

return utility.loadSpObject(img,dispatcher,sp);

}
async function apiJustLoad(spObject,sp){
 return await utility.loadInitialImage('logo.jpg',spObject,sp);
}

async function apiCircleSegmented(startY,startX,radius,rgb,label,sp){

return utility.applyCircleOperation(startY,startX,radius,rgb,label,sp);

}


async function apimergeInstances(rgbs,labels,sp)
{
return utility.mergelabels(rgbs,labels,sp);
}

async function apiFreeForm(points,rgb,label,sp){
return utility.applyFreeFormOperation(points,rgb,label,sp);
}


async function apiMagicTouch(points,rgb,label,sp){
return utility.applyMagicTouchOperation(points,rgb,label,sp);
}

async function apigetTouchBoundary(pointY,pointX,sp){
return utility.getSegmentBoundary(pointY,pointX,sp);
}

async function apisaveImage(saveImageBuffer,userid,datasetid,imageid,sp){
return utility.saveImage(saveImageBuffer,userid,datasetid,imageid,sp);
}


async function apiRetrieveIntermediate(userid,datasetid,imageid,sp){

return utility.retrieveSpObject(userid,datasetid,imageid,sp);

}

async function apisaveIntermediate(userid,datasetid,imageid,sp){

return utility.saveImageWork(userid,datasetid,imageid,sp);

}


async function apiResetProgress(userid,datasetid,imageid,sp){
return utility.resetSpObject(userid,datasetid,imageid,sp);
}

async function apiapplyForeground(foregrounds,sp){
return utility.applyForeground(foregrounds,sp);
}
 
async function apihistorybackward(sp){
return utility.historyBackward(sp);
}

async function apihistoryforward(sp){
return utility.historyForward(sp);
}


export function *watchOperations(socket,exchange){
while(true){



const message=yield take('CONNECTION');// OPERATION IS THE INITIAL MESSAGE , NOT Channel Remember 

let sp={};
const socketIdReply={
type:'CONNECTID',
payload:socket.id
}

console.log("Started Listening for ",socket.id);

try{
yield put(socketEmit(socketIdReply));
}catch(error){
console.error('Caught during socketEmit',error)
}





while(true){
const message=yield take(socket.id); // OPERATION IS THE MESSAGE , Not Channel Remember 


console.log("Got Special Message from Socket ID ");

console.log("Meta Data "+JSON.stringify(message.payload));

console.log("Operation "+message.payload.operationType);


console.log("SP  retaiend is ",sp);
console.log("Socket ID ",socket.id);

if(message.payload.operationType=="Load"){


console.log("Payload",message.payload.datapayload.imageId);

//userID,datasetID

console.log("DataSetId",message.payload.datapayload.datasetId);

let  img=yield call(justLoadImage,message.payload.datapayload.userId,message.payload.datapayload.datasetId,message.payload.datapayload.imageId,sp);

let dimensions=sizeOf(img);

console.log("Dimensions",dimensions.width,dimensions.height);


console.log("Before Wiping Off",sp);

 let getSp=yield call(apiRetrieveIntermediate,message.payload.datapayload.userId,message.payload.datapayload.datasetId,message.payload.datapayload.imageId,sp);

sp=getSp.obj;
console.log("SP is",sp);

 const reply = {
          type: 'REPLY',
          payload: {
                data:getSp.img,
		orgi:img,
		width:dimensions.width,
		height:dimensions.height,
		note:getSp.note,
		instanceColors:getSp.instances
}
}

storeReference.storeReference.dispatch({
type:changeOperatingImage,
payload:getSp.img});





 try {
     yield put(socketEmit(reply))
       } catch(error) {
          console.error('Caught during socketEmit', error)
            }




}
else if(message.payload.operationType=="Rectangle")
{
console.log("Rectangle Operation Here ");

console.log("PARAMS",message.payload.datapayload);

//storeReference.storeReference.getState().meanshift
let segData=yield call(apiRectangleSegmented,storeReference.storeReference.getState().meanshift,message.payload.datapayload.tly,message.payload.datapayload.tlx,message.payload.datapayload.bry,message.payload.datapayload.brx,message.payload.datapayload.rgb,message.payload.datapayload.label,sp);


 const reply={

          type:'OPERATE',
          payload:{
                data:segData
        }
}

//Just hope dispatch comes with connect 
console.log("Now Dispatching Stuff ");


storeReference.storeReference.dispatch({
type:changeOperatingImage,
payload:segData});



 try {
    yield put(socketEmit(reply))
	storeReference.storeReference.dispatch({
type:changeOperatingImage,
payload:segData});

  } catch(error) {
   console.error('Caught during socketEmit', error)
  }
}
else if(message.payload.operationType=="Circle"){

console.log("Circle Operation Here ");
let segData=yield call(apiCircleSegmented,message.payload.datapayload.startY,message.payload.datapayload.startX,message.payload.datapayload.radius,message.payload.datapayload.rgb,message.payload.datapayload.label,sp);


 const reply={

          type:'OPERATE',
          payload:{
                data:segData
        }
}


storeReference.storeReference.dispatch({
type:changeOperatingImage,
payload:segData});


 try {
    yield put(socketEmit(reply))
        storeReference.storeReference.dispatch({
type:changeOperatingImage,
payload:segData});

  } catch(error) {
   console.error('Caught during socketEmit', error)
  }
}else if(message.payload.operationType=="FreeForm"){

let segData=yield call(apiFreeForm,message.payload.datapayload.points,message.payload.datapayload.rgb,message.payload.datapayload.label,sp);

 const reply={

          type:'OPERATE',
          payload:{
                data:segData
        }
}


storeReference.storeReference.dispatch({
type:changeOperatingImage,
payload:segData});


 try {
    yield put(socketEmit(reply))
        storeReference.storeReference.dispatch({
type:changeOperatingImage,
payload:segData});

  } catch(error) {
   console.error('Caught during socketEmit', error)
  }



}else if(message.payload.operationType=="MagicTouch"){

console.log("Inside part of Magic Touch");


let segData=yield call(apiMagicTouch,message.payload.datapayload.points,message.payload.datapayload.rgb,message.payload.datapayload.label,sp);

 const reply={
          type:'OPERATE',
          payload:{
                data:segData
        }
}


storeReference.storeReference.dispatch({
type:changeOperatingImage,
payload:segData});


 try {
    yield put(socketEmit(reply))
        storeReference.storeReference.dispatch({
type:changeOperatingImage,
payload:segData});

  } catch(error) {
   console.error('Caught during socketEmit', error)
  }




}else if(message.payload.operationType=="Boundary"){

let segBoundary=yield call(apigetTouchBoundary,message.payload.datapayload.y,message.payload.datapayload.x,sp);

const reply={
          type:'BOUNDARY',
          payload:{
                data:segBoundary
        }
}
 try {
    yield put(socketEmit(reply))

	//TODO : Might need to preserve segdata , If needed 
  } catch(error) {
   console.error('Caught during socketEmit', error)
  }

}else if(message.payload.operationType=="Completed")
{

console.log("Save Completed Image Now ");
let base64Data=message.payload.datapayload.base64.data;
base64Data=base64Data.replace(/^data:image\/jpg;base64,/, "");
base64Data+= base64Data.replace('+', ' ');


yield call(apisaveImage,base64Data,message.payload.datapayload.userid,message.payload.datapayload.datasetid,message.payload.datapayload.imageid,sp)

console.log("Go Back again and hope it works ");

}
else if(message.payload.operationType=="Reset"){
console.log("Resetting the current progress to Back ");

console.log("User iD ",message.payload.datapayload.userid);
console.log("DAtaSet Id ",message.payload.datapayload.datasetid);
console.log("Image Id ",message.payload.datapayload.imageid);

let  img=yield call(justLoadImage,message.payload.datapayload.userid,message.payload.datapayload.datasetid,message.payload.datapayload.imageid,sp);

let dimensions=sizeOf(img);

console.log("Dimensions",dimensions.width,dimensions.height);

 let getSp=yield call(apiResetProgress,message.payload.datapayload.userid,message.payload.datapayload.datasetid,message.payload.datapayload.imageid,sp);

sp=getSp.obj;
console.log("SP is",sp);

 const reply = {
          type: 'REPLY',
          payload: {
                data:getSp.img,
                orgi:img,
                width:dimensions.width,
                height:dimensions.height,
		note:getSp.note,
		instanceColors:getSp.instances
}
}

 try {
     yield put(socketEmit(reply))
       } catch(error) {
          console.error('Caught during socketEmit', error)
            }




}
else if(message.payload.operationType=="MergeInstance")
{
console.log("Merging Instances of different colors ")

let segdata=yield call(apimergeInstances,message.payload.datapayload.rgbs,message.payload.datapayload.labels,sp);


const reply={
          type:'OPERATE',
          payload:{
                data:segdata
        }
}

console.log("Dispatching Now ")
storeReference.storeReference.dispatch({
type:changeOperatingImage,
payload:segdata});

try {
    yield put(socketEmit(reply))
        storeReference.storeReference.dispatch({
type:changeOperatingImage,
payload:segdata});

  } catch(error) {
   console.error('Caught during socketEmit', error)
  }



}
else if(message.payload.operationType=="Foreground")
{
console.log("Applying Foreground Operation ");

let segdata=yield call(apiapplyForeground,message.payload.datapayload.foregroundArray,sp)

const reply={
          type:'OPERATE',
          payload:{
                data:segdata
        }
}

console.log("Dispatching Now ")
storeReference.storeReference.dispatch({
type:changeOperatingImage,
payload:segdata});

try {
    yield put(socketEmit(reply))
        storeReference.storeReference.dispatch({
type:changeOperatingImage,
payload:segdata});

  } catch(error) {
   console.error('Caught during socketEmit', error)
  }



}
else if(message.payload.operationType=="historyback")
{
console.log("History Backwards ");

let segdata=yield call(apihistorybackward,sp);
const reply={
          type:'OPERATE',
          payload:{
                data:segdata
        }
}

console.log("Dispatching Now ")
storeReference.storeReference.dispatch({
type:changeOperatingImage,
payload:segdata});

try {
    yield put(socketEmit(reply))
        storeReference.storeReference.dispatch({
type:changeOperatingImage,
payload:segdata});

  } catch(error) {
   console.error('Caught during socketEmit', error)
  }
}
else if (message.payload.operationType=="historyforward")
{
console.log("History Forward ");
let segdata=yield call(apihistoryforward,sp);
const reply={
          type:'OPERATE',
          payload:{
                data:segdata
        }
}
console.log("Dispatching Now ")
storeReference.storeReference.dispatch({
type:changeOperatingImage,
payload:segdata});
try {
    yield put(socketEmit(reply))
        storeReference.storeReference.dispatch({
type:changeOperatingImage,
payload:segdata});

  } catch(error) {
   console.error('Caught during socketEmit', error)
  }
}
else if(message.payload.operationType=="Save")
{


console.log("Starting to Save Image ");


console.log("USer id ",message.payload.datapayload.userid);
console.log("Data Set Id ",message.payload.datapayload.datasetid);
console.log("Image Id ",message.payload.datapayload.imageid);

console.log("Sp",sp);
yield call (apisaveIntermediate,message.payload.datapayload.userid,message.payload.datapayload.datasetid,message.payload.datapayload.imageid,sp);

console.log("Saving The Work Completed ");

//Send a response of reducer form 

 const reply = {
          type: 'SAVED',
          payload: {
                alert:"Completed Saving Current Image Annotation"
		}
}

 try {
     yield put(socketEmit(reply))
       } catch(error) {
          console.error('Caught during socketEmit', error)
            }

}

}
}
}

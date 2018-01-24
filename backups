var fs = require('fs');
import {call, cps, take, put, fork } from 'redux-saga/effects'
import { socketEmit, createChannelSubscription } from 'redux-saga-sc'

const Promise = require('bluebird');

import utility from '../utility'

let sizeOf=require('image-size');


import storeReference from '../worker';


let changeOperatingImage="CHANGE_OPERATING_IMAGE";
let storespCache="STORE_SP_CACHE";

async function apiRectangleSegmented(sp,tly,tlx,bry,brx,rgb){
//sth else stuff 
  return await utility.applyRectangleOperation(sp,tly,tlx,bry,brx,rgb);
};

async function justLoadImage(userId,datasetId,imageId){

return await utility.justLoadImage(userId,datasetId,imageId);

}
function apiloadSp(dispatcher,img){

return utility.loadSpObject(img,dispatcher);

}
async function apiJustLoad(spObject){
 return await utility.loadInitialImage('logo.jpg',spObject);
}

async function apiCircleSegmented(startY,startX,radius,rgb){

return utility.applyCircleOperation(startY,startX,radius,rgb);

}


async function apiFreeForm(points,rgb){
return utility.applyFreeFormOperation(points,rgb);
}


async function apiMagicTouch(points,rgb){
return utility.applyMagicTouchOperation(points,rgb);
}

async function apigetTouchBoundary(pointY,pointX){
return utility.getSegmentBoundary(pointY,pointX);
}

async function apisaveImage(saveImageBuffer,userid,datasetid,imageid){
return utility.saveImage(saveImageBuffer,userid,datasetid,imageid);
}


async function apiRetrieveIntermediate(userid,datasetid,imageid){

return utility.retrieveSpObject(userid,datasetid,imageid);

}

async function apisaveIntermediate(userid,datasetid,imageid){

return utility.saveImageWork(userid,datasetid,imageid);

}
export function *watchOperations(socket,exchange){
while(true){


const message=yield take('OPERATION'); // OPERATION IS THE MESSAGE , Not Channel Remember 
// CHANNEL IS OPERATE 
console.log("Operation "+message.payload.operationType);

//OpType either rectangle or laod 
if(message.payload.operationType=="Load"){
console.log("Plain Loading Operation ");

console.log(message.payload);

console.log("Payload",message.payload.datapayload.imageId);

//userID,datasetID

console.log("DataSetId",message.payload.datapayload.datasetId);

let  img=yield call(justLoadImage,message.payload.datapayload.userId,message.payload.datapayload.datasetId,message.payload.datapayload.imageId);

let dimensions=sizeOf(img);

console.log("Dimensions",dimensions.width,dimensions.height);


 let getSp=yield call(apiRetrieveIntermediate,message.payload.datapayload.userId,message.payload.datapayload.datasetId,message.payload.datapayload.imageId);



//let getSp=utility.loadSpObject(img,storeReference.storeReference);

  storeReference.storeReference.dispatch({
type:storespCache,
payload:getSp.obj});
console.log("Saved SP");


//let sp = Promise.promisifyAll(storeReference.storeReference.getState().meanshift);




//let loadData=yield call(apiJustLoad,sp);


 const reply = {
          type: 'REPLY',
          payload: {
                data:getSp.image,
		orgi:img,
		width:dimensions.width,
		height:dimensions.height}
}

storeReference.storeReference.dispatch({
type:changeOperatingImage,
payload:getSp});





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
let segData=yield call(apiRectangleSegmented,storeReference.storeReference.getState().meanshift,message.payload.datapayload.tly,message.payload.datapayload.tlx,message.payload.datapayload.bry,message.payload.datapayload.brx,message.payload.datapayload.rgb);


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
let segData=yield call(apiCircleSegmented,message.payload.datapayload.startY,message.payload.datapayload.startX,message.payload.datapayload.radius,message.payload.datapayload.rgb);


 const reply={

          type:'REPLY',
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

let segData=yield call(apiFreeForm,message.payload.datapayload.points,message.payload.datapayload.rgb);

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


let segData=yield call(apiMagicTouch,message.payload.datapayload.points,message.payload.datapayload.rgb);

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

let segBoundary=yield call(apigetTouchBoundary,message.payload.datapayload.y,message.payload.datapayload.x);

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


yield call(apisaveImage,base64Data,message.payload.datapayload.userid,message.payload.datapayload.datasetid,message.payload.datapayload.imageid)

console.log("Go Back again and hope it works ");

}
else if(message.payload.operationType=="Save")
{

yield call (apisaveIntermediate,message.payload.datapayload.userid,message.payload.datapayload.datasetid,message.payload.datapayload.imageid);

console.log("Go Back Again and hope it works ");

}

}
}

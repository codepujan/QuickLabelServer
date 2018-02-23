var fs = require('fs');
const Promise = require('bluebird');
const  promiseFs=Promise.promisifyAll(require('fs'));

const cassandra = require('cassandra-driver');
const Tuple=require('cassandra-driver').types.Tuple;

const mslearn = require('../../newtouchMeanShift/MSlearn/cpp/build/Release/mslearn');

const gsp = require('./module_sp');

var cachedCurrentImage;  // So That We don't need to pack and send two images from the client side 



const sslOptions = {
  key : fs.readFileSync('/home/ppaudel/.cassandra/cass100.key.pem'),
  cert : fs.readFileSync('/home/ppaudel/.cassandra/cass100.cer.pem'),
  ca : [fs.readFileSync('/home/ppaudel/.cassandra/cass100.cer.pem')]
};

let client = new cassandra.Client({
  contactPoints : ['10.1.145.100'],
  authProvider : new cassandra.auth.PlainTextAuthProvider('shipenger_test_app', 's4hbM7E2!*B*U*ti#VfvRm'),
  sslOptions : sslOptions,
  promiseFactory : Promise.fromCallback
});




async function applyRectangleOperation(msp,tly,tlx,bry,brx,rgb,sp){
//initial segmentation


//sp = Promise.promisifyAll(sp);


//let nc = sp.columns();
//For now 
//let nc=480;
let nc=sp.columns();

console.log("Applying Rectangle",tly,tlx,bry,brx);
let tlbr = new Int32Array([tly*nc+tlx, bry*nc+brx]);
let color_chosen = new Uint8Array([rgb.r, rgb.g, rgb.b]);
let img = await sp.mergeRectangularAsyncAsync(tlbr, tlbr.length,color_chosen,color_chosen.length);
return img;

}

async function applyFreeFormOperation(points,rgb,sp){


console.log(points,rgb);


let nc = sp.columns();
let ffpixels;
let mmfpixels=[];
for(var i=0;i<points.length;i++)
        mmfpixels.push(points[i].y*nc+points[i].x);



ffpixels=Int32Array.from(mmfpixels);
let color_chosen = new Uint8Array([rgb.r, rgb.g, rgb.b]);
let img = await sp.mergeFreeFormAsyncAsync(ffpixels, ffpixels.length,
                                 color_chosen, color_chosen.length);

return img;

}


async function applyMagicTouchOperation(points,rgb,sp){

console.log("Magic Points",points);
console.log("Magic RGB",rgb);
let nc = sp.columns();
let ffpixels;
let mmfpixels=[];
for(var i=0;i<points.length;i++)
        mmfpixels.push(points[i].y*nc+points[i].x);

let color_chosen = new Uint8Array([rgb.r, rgb.g, rgb.b]);

ffpixels=Int32Array.from(mmfpixels);

console.log("My Points",ffpixels);

let img=await sp.mergeAsyncAsync(ffpixels,ffpixels.length,color_chosen,color_chosen.length);

return img;

} 

async function justLoadImage(userID,datasetID,imageid,sp){

//let img=await fs.readFileAsync(path);

console.log("Image id Got is ",imageid);

await client.connect();

let query_s = 'SELECT * FROM labelingapp.imagestorage WHERE user_id=? and dataset_name=? and imageid=?';

//let imageId='23d619ac-ef7f-4976-9bd4-61a0b132e33c';
//TODO : userId and userDatabase 
console.log("USER ID ",userID);
console.log("DataSet ID ",datasetID);


let param_s = [userID,datasetID,imageid];

let result=await client.execute(query_s,param_s,{ prepare: true });

let img=result.rows[0].imageblob;

return img;

}

 async function resetSpObject(userID,datasetID,imageid,sp){

await client.connect();

//First ,complete the update part of things 
let query_s = 'UPDATE labelingapp.imagestorage SET spobject=? WHERE user_id=? and dataset_name=? and imageid=?';
let param_s = ['empty',userID,datasetID,imageid];

let result=await client.execute(query_s,param_s,{ prepare: true });

//Okay now we have updated the SP 
//But also , we need to retrive the new sp and send him over the enw one 

query_s = 'SELECT * FROM labelingapp.imagestorage WHERE user_id=? and dataset_name=? and imageid=?';


param_s = [userID,datasetID,imageid];
 
result=await client.execute(query_s,param_s,{ prepare: true });

let img=result.rows[0].imageblob;

let notes=result.rows[0].notes;


let instanceColors=result.rows[0].savedinstancehex;


console.log("Instance COlor is ",instanceColors);

console.log("Gotta Fetch a New Fresh  State To The USer ");

sp=gsp.get_sp(img);

sp=Promise.promisifyAll(sp);

let restored = await sp.segmentAsyncAsync();

return {img:restored,obj:sp,note:notes,instances:instanceColors};

}

async function retrieveSpObject(userID,datasetID,imageid,sp){
await client.connect();

let query_s = 'SELECT * FROM labelingapp.imagestorage WHERE user_id=? and dataset_name=? and imageid=?';


let param_s = [userID,datasetID,imageid];

let result=await client.execute(query_s,param_s,{ prepare: true });

let strbuf=result.rows[0].spobject;

let img=result.rows[0].imageblob;

let notes=result.rows[0].notes;

let instanceColors=result.rows[0].savedinstancehex;


let restored;

if(strbuf===null||strbuf=="empty"){ // Empty is the manual deleteing of saved state 

console.log("Loading Fresh State ");
sp=gsp.get_sp(img);

sp=Promise.promisifyAll(sp);

restored = await sp.segmentAsyncAsync();


}else{

console.log("Loading saved State ");

sp=gsp.get_sp(img);

sp=Promise.promisifyAll(sp);


let buffer=Buffer.from(strbuf,'utf-8');



console.log("Buffer Length is ",buffer.length);

restored= await sp.restoreWorkAsyncAsync(buffer, buffer.length);

}

console.log(restored);

return {img:restored,obj:sp,note:notes,instances:instanceColors};

}

function loadSpObject(img,dispatcher,sp){

//This one ,Commented Out  just for Restore check 

sp = new mslearn.SegProc(img,img.length);
sp = Promise.promisifyAll(sp);
return sp;
}



async function loadInitialImage(path,sp){
//  let img = await fs.readFileAsync(path);
let img = await sp.segmentAsyncAsync();
return img;

}

async function getSegmentBoundary(pointY,pointX,sp){
let nc=sp.columns();
 let pixel_clicked = pointY*nc+pointX;
let buf = await sp.getBoundaryAsyncAsync(pixel_clicked);
console.log('buf: ', buf.length);
  let arr = new Int32Array(buf.length/4);
  let offset = 0;
  for(let i = 0; i < arr.length; i++) {
    arr[i] = buf.readInt32LE(offset);
    offset = offset+4;
  }
let returnValue=[];
 arr.forEach(e => {
returnValue.push({y:Math.floor(e/nc),x:e-(Math.floor(e/nc)*nc)})
});

return returnValue;
}


async function applyCircleOperation(startY,startX,radius,rgb,sp){

let nc=sp.columns();

console.log("Applying Circle",startY,startX,radius,rgb);
let ctrRad = new Int32Array([startY*nc+startX,radius]);
let color_chosen = new Uint8Array([rgb.r,rgb.g,rgb.b]);
let img = await sp.mergeCircularAsyncAsync(ctrRad, ctrRad.length,
                                 color_chosen, color_chosen.length);
return img;
}


async function saveImageWork(userid,datasetid,imageid,sp){
console.log(userid);
console.log(datasetid);
console.log(imageid);

 let strbuf = await sp.saveWorkAsyncAsync();
console.log("Serialized Object");

await client.connect();

let query_s = 'UPDATE labelingapp.imagestorage SET spobject=? WHERE user_id=? and dataset_name=? and imageid=?';


//await fs.writeFileAsync('./dumpfiles/before_write.buf', strbuf);

let param_s = [strbuf.toString('utf-8'),userid,datasetid,imageid];

let result=await client.execute(query_s,param_s,{ prepare: true });

console.log("UPDATE EXECUTED ");




}
async function saveImage(saveImageBuffer,userid,datasetid,imageid,sp){

console.log(userid);
console.log(datasetid);
console.log(imageid);

let buffer=new Buffer(saveImageBuffer,'base64');

await client.connect();

let query_s = 'UPDATE labelingapp.imagestorage SET segmentedimageblob=? WHERE user_id=? and dataset_name=? and imageid=?';


let param_s = [buffer,userid,datasetid,imageid];

let result=await client.execute(query_s,param_s,{ prepare: true });

console.log("UPDATE EXECUTED ");

}



export default {loadInitialImage,applyRectangleOperation,loadSpObject,justLoadImage,applyCircleOperation,applyFreeFormOperation,applyMagicTouchOperation,getSegmentBoundary,saveImage,saveImageWork,retrieveSpObject,resetSpObject}



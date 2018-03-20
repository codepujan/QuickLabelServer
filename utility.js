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




async function applyRectangleOperation(msp,tly,tlx,bry,brx,rgb,label,sp){

console.log("Applying Rectangle",tly,tlx,bry,brx);
console.log("Label is ",label);

let nc=sp.columns();

let tlbr = new Int32Array([tly*nc+tlx, bry*nc+brx]);
let color_chosen = new Uint8Array([rgb.r, rgb.g, rgb.b]);


console.log("Working on Label ",label);
let img = await sp.mergeRectangularAsyncAsync(tlbr, tlbr.length,color_chosen,color_chosen.length,label);
return img;

}

async function applyFreeFormOperation(points,rgb,label,sp){


console.log(points,rgb);


let nc = sp.columns();
let ffpixels;
let mmfpixels=[];
for(var i=0;i<points.length;i++)
        mmfpixels.push(points[i].y*nc+points[i].x);



ffpixels=Int32Array.from(mmfpixels);
let color_chosen = new Uint8Array([rgb.r, rgb.g, rgb.b]);
let img = await sp.mergeFreeFormAsyncAsync(ffpixels, ffpixels.length,
                                 color_chosen, color_chosen.length,label);

return img;

}


async function applyMagicTouchOperation(points,rgb,label,sp){

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

let img=await sp.mergeAsyncAsync(ffpixels,ffpixels.length,color_chosen,color_chosen.length,label);

return img;

} 

async function justLoadImage(userID,datasetID,imageid,sp){

//let img=await fs.readFileAsync(path);

console.log("Image id Got is ",imageid);

await client.connect();

let query_s = 'SELECT * FROM labelingapp.imagestorage WHERE user_id=? and dataset_name=? and uploadedat=?';

//let imageId='23d619ac-ef7f-4976-9bd4-61a0b132e33c';
//TODO : userId and userDatabase 
console.log("USER ID ",userID);
console.log("DataSet ID ",datasetID);


let param_s = [userID,datasetID,imageid];

let result=await client.execute(query_s,param_s,{ prepare: true });

let img=result.rows[0].imageblob;



//Before returning : mark this as currently active image 
let update_state='UPDATE labelingapp.userstates SET lastActiveImage=?,lastactivedataset=? WHERE user_id=?';
let value_update=[imageid,datasetID,userID];

await client.execute(update_state,value_update,{prepare:true});

return img;

}

 async function resetSpObject(userID,datasetID,imageid,sp){

await client.connect();

//First ,complete the update part of things 
let query_s = 'UPDATE labelingapp.imagestorage SET spobject=? WHERE user_id=? and dataset_name=? and uploadedat=?';
let param_s = ['empty',userID,datasetID,imageid];

let result=await client.execute(query_s,param_s,{ prepare: true });

//Okay now we have updated the SP 
//But also , we need to retrive the new sp and send him over the enw one 

query_s = 'SELECT * FROM labelingapp.imagestorage WHERE user_id=? and dataset_name=? and uploadedat=?';


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

let query_s = 'SELECT * FROM labelingapp.imagestorage WHERE user_id=? and dataset_name=? and uploadedat=?';


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

//applyForeground(foregrounds,sp)
async function applyForeground(foregrounds,sp)
{
console.log("Foregrounds Array is ",foregrounds);

let img=await sp.setForegroundAsyncAsync(foregrounds);


console.log("Applied Foreground ");
return img;

}

async function historyBackward(sp){
let img=await sp.historyBackAsyncAsync();
return img;
}

async function historyForward(sp){
let img=await sp.historyForwardAsyncAsync();
return img;
}
 
async function mergelabels(mergergb,mergelabel,sp)
{

//Need to call  a loop of nums here
console.log("RGBS I got are ",mergergb);

console.log("Labels i got are ",mergelabel);
 
let img;
let color_chosen;
for(let i=0;i<mergergb.length;i++){

color_chosen = new Uint8Array([mergergb[i].r,mergergb[i].g,mergergb[i].b]);

img=await sp.setLabelColorAsyncAsync(mergelabel[i], color_chosen, color_chosen.length);
}

//APplying multiple merges and returning the image only after merges are complete 
//Don't know how it shall respond to history 
//Check it and report back to Dr. Murali 

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


async function applyCircleOperation(startY,startX,radius,rgb,label,sp){

let nc=sp.columns();

console.log("Applying Circle",startY,startX,radius,rgb);
let ctrRad = new Int32Array([startY*nc+startX,radius]);
let color_chosen = new Uint8Array([rgb.r,rgb.g,rgb.b]);
let img = await sp.mergeCircularAsyncAsync(ctrRad, ctrRad.length,
                                 color_chosen, color_chosen.length,label);
return img;
}


async function saveImageWork(userid,datasetid,imageid,sp){
console.log(userid);
console.log(datasetid);
console.log(imageid);

 let strbuf = await sp.saveWorkAsyncAsync();
console.log("Serialized Object");

await client.connect();

let query_s = 'UPDATE labelingapp.imagestorage SET spobject=? WHERE user_id=? and dataset_name=? and uploadedat=?';


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

let query_s = 'UPDATE labelingapp.imagestorage SET segmentedimageblob=?,completedstatus=? WHERE user_id=? and dataset_name=? and uploadedat=?';

//Setting 1 as completed directly 
let param_s = [buffer,1,userid,datasetid,imageid];

let result=await client.execute(query_s,param_s,{ prepare: true });

console.log(" Save Image UPDATE EXECUTED ");

}



export default {loadInitialImage,applyRectangleOperation,loadSpObject,justLoadImage,applyCircleOperation,applyFreeFormOperation,applyMagicTouchOperation,getSegmentBoundary,saveImage,saveImageWork,retrieveSpObject,resetSpObject,applyForeground,historyBackward,historyForward, mergelabels}



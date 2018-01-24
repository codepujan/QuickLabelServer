var fs = require('fs');
const Promise = require('bluebird');
const  promiseFs=Promise.promisifyAll(require('fs'));

const cassandra = require('cassandra-driver');
const Tuple=require('cassandra-driver').types.Tuple;

const mslearn = require('../../newtouchMeanShift/MSlearn/cpp/build/Release/mslearn');

const gsp = require('./module_sp');


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

class Operation{


testFunc(){
console.log("Wohoooo");
}


constructor(){
this.sp={};
this.testFunc=this.testFunc.bind(this);
this.applyRectangleOperation=this.applyRectangleOperation.bind(this);
this.retrieveSpObject=this.retrieveSpObject.bind(this);

}


async applyRectangleOperation(msp,tly,tlx,bry,brx,rgb){

let nc=this.sp.columns();

console.log("Applying Rectangle",tly,tlx,bry,brx);
let tlbr = new Int32Array([tly*nc+tlx, bry*nc+brx]);
let color_chosen = new Uint8Array([rgb.r, rgb.g, rgb.b]);
let img = await this.sp.mergeRectangularAsyncAsync(tlbr, tlbr.length,color_chosen,color_chosen.length);
return img;
}

async applyFreeFormOperation(points,rgb){


console.log(points,rgb);


let nc = this.sp.columns();
let ffpixels;
let mmfpixels=[];
for(var i=0;i<points.length;i++)
        mmfpixels.push(points[i].y*nc+points[i].x);



ffpixels=Int32Array.from(mmfpixels);
let color_chosen = new Uint8Array([rgb.r, rgb.g, rgb.b]);
let img = await this.sp.mergeFreeFormAsyncAsync(ffpixels, ffpixels.length,
                                 color_chosen, color_chosen.length);

return img;

}



async applyMagicTouchOperation(points,rgb){

console.log("Magic Points",points);
console.log("Magic RGB",rgb);
let nc = this.sp.columns();
let ffpixels;
let mmfpixels=[];
for(var i=0;i<points.length;i++)
        mmfpixels.push(points[i].y*nc+points[i].x);

let color_chosen = new Uint8Array([rgb.r, rgb.g, rgb.b]);

ffpixels=Int32Array.from(mmfpixels);

console.log("My Points",ffpixels);

let img=await this.sp.mergeAsyncAsync(ffpixels,ffpixels.length,color_chosen,color_chosen.length);

return img;

}


async justLoadImage(userID,datasetID,imageid){

let img=await fs.readFileAsync(path);

console.log("Image id Got is ",imageid);

await client.connect();
let query_s = 'SELECT * FROM labelingapp.imagestorage WHERE user_id=? and dataset_name=? and imageid=?';
console.log("USER ID ",userID);
console.log("DataSet ID ",datasetID);

let param_s = [userID,datasetID,imageid];
let result=await client.execute(query_s,param_s,{ prepare: true });
let img2=result.rows[0].imageblob;

return img2;

}

async retrieveSpObject(userID,datasetID,imageid){
await client.connect();

let query_s = 'SELECT * FROM labelingapp.imagestorage WHERE user_id=? and dataset_name=? and imageid=?';


console.log("UserID",userID);
console.log("DataSetID",datasetID);
console.log("ImageId",imageid);


let param_s = [userID,datasetID,imageid];

let result=await client.execute(query_s,param_s,{ prepare: true });

let strbuf=result.rows[0].spobject;

let img=result.rows[0].imageblob;

let restored;

if(strbuf===null){

console.log("Loading Fresh State ");
this.sp=gsp.get_sp(img);

this.sp=Promise.promisifyAll(this.sp);

restored = await this.sp.segmentAsyncAsync();


}else{

console.log("Loading saved State ");

this.sp=gsp.get_sp(img);

this.sp=Promise.promisifyAll(this.sp);


let buffer=Buffer.from(strbuf,'utf-8');



console.log("Buffer Length is ",buffer.length);

restored=this.sp.restoreWorkAsyncAsync(buffer, buffer.length);

}

return{image:restored,obj:this.sp};

}

loadSpObject(img,dispatcher){

//This one ,Commented Out  just for Restore check 
//
this.sp = new mslearn.SegProc(img,img.length);
this.sp = Promise.promisifyAll(sp);
return sp;
}
//
//
//
async loadInitialImage(path,sp1){
let img = await this.sp.segmentAsyncAsync();
return img;
}


async getSegmentBoundary(pointY,pointX){
let nc=this.sp.columns();
 let pixel_clicked = pointY*nc+pointX;
let buf = await this.sp.getBoundaryAsyncAsync(pixel_clicked);
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


async applyCircleOperation(startY,startX,radius,rgb){

let nc=this.sp.columns();

console.log("Applying Circle",startY,startX,radius,rgb);
let ctrRad = new Int32Array([startY*nc+startX,radius]);
let color_chosen = new Uint8Array([rgb.r,rgb.g,rgb.b]);
let img = await this.sp.mergeCircularAsyncAsync(ctrRad, ctrRad.length,
                                 color_chosen, color_chosen.length);
return img;
}

async saveImageWork(userid,datasetid,imageid){
console.log(userid);
console.log(datasetid);
console.log(imageid);

 let strbuf = await this.sp.saveWorkAsyncAsync();
console.log("Serialized Object");

await client.connect();

let query_s = 'UPDATE labelingapp.imagestorage SET spobject=? WHERE user_id=? and dataset_name=? and imageid=?';


let param_s = [strbuf.toString('utf-8'),userid,datasetid,imageid];
let result=await client.execute(query_s,param_s,{ prepare: true });
console.log("UPDATE EXECUTED ");
}

async saveImage(saveImageBuffer,userid,datasetid,imageid){

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

}
exports.Operation=Operation;


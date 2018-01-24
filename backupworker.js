var fs = require('fs');
var express = require('express');
var serveStatic = require('serve-static');
var path = require('path');
var morgan = require('morgan');
var healthChecker = require('sc-framework-health-check');
var jpeg = require('jpeg-js');
let sp;
var globalSocket;


const Promise = require('bluebird');
const  promiseFs=Promise.promisifyAll(require('fs'));

const mslearn = require('../../touchMeanShift/MSlearn/cpp/build/Release/mslearn');
var cachedCurrentImage;  // So That We don't need to pack and send two images from the client side 
// This  will be  incremental based on the actions we will be taking 


function writeFileFromInvidualBuffer(buffer){


var width = 384, height = 288;
var rawImageData = {
  data: buffer,
  width: width,
  height: height
};

var jpegImageData = jpeg.encode(rawImageData, 50);
return jpegImageData.data;
}


function callMeanShiftSegmentation(source){
console.log(source.length);
  sp = new mslearn.SegProc(source, source.length);
sp.segmentAsync((err,segmented_image)=>{

if(err) {
      console.log(err);
    } else {
     console.log("Segmentation Done !!");
cachedCurrentImage=segmented_image;
globalSocket.emit("imageBuffer",cachedCurrentImage);

}
});

}

async function segmentImageAsync(img){
//initial segmentation
  sp = new mslearn.SegProc(img, img.length);
  sp = Promise.promisifyAll(sp);
  img = await sp.segmentAsyncAsync()


  console.log("Done Segmenting  Image Stuff ");
  cachedCurrentImage=img;
  globalSocket.emit("imageBuffer",cachedCurrentImage);

}

async function segmentComponentsCircle(y,x,radius){

//not passing Sp here directly , 
//assuming we have this sp object before hand while the segmentation has already taken place . 
console.log("Y is",y);
console.log("X is ",x);
console.log("Radius is ",radius);

let nc = sp.columns();
//let ctrRad = new Int32Array([175*nc+312, 35]);
let ctrRad = new Int32Array([y*nc+x,radius]);
  color_chosen = new Uint8Array([228, 228, 0]);
  img = await sp.mergeCircularAsyncAsync(ctrRad, ctrRad.length,
                                 color_chosen, color_chosen.length);
  console.log("Completed Segmenting Component Circle");
  cachedCurrentImage=img;
  globalSocket.emit("imageBuffer",cachedCurrentImage);

}


async function segmentComponentFreeForm(points){

let nc = sp.columns();
let ffpixels;
let mmfpixels=[];
for(i=0;i<points.length;i++)
        mmfpixels.push(points[i].y*nc+points[i].x);



ffpixels=Int32Array.from(mmfpixels);

console.log(ffpixels.length);
//let ffpixels = new Int32Array([55*nc+110,80*nc+130,65*nc+145,80*nc+165,35*nc+140]);
  color_chosen = new Uint8Array([0, 228, 150]);
  img = await sp.mergeFreeFormAsyncAsync(ffpixels, ffpixels.length,
                                 color_chosen, color_chosen.length);
  console.log("Completed Segmenting Component Free Form");
cachedCurrentImage=img;
  globalSocket.emit("imageBuffer",cachedCurrentImage);


}
function callOpenCVProcessing(threshold,source,workingScale,baseX,baseY,pencilPoints){
//threshold.segmentZoomColor('./tmp/patchoutput.png',source);
/**


threshold.segmentZoomColor('./tmp/patchoutput.png',source,workingScale,baseX,baseY);
var buffer=source.toBuffer();
console.log("Labeling Done . Now Sending back the Output");

cachedCurrentImage=buffer;
source.save('tmp/bufferOutput.png');
globalSocket.emit("imageBuffer",cachedCurrentImage);
**/

//pencilPoints
source.recievePointArray(pencilPoints,'./tmp/pencilDraw.png',workingScale,baseX,baseY);
var buffer=source.toBuffer();

cachedCurrentImage=buffer;

globalSocket.emit("imageBuffer",cachedCurrentImage);

}

module.exports.run = function (worker) {
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



  app.get('/sendSomeData',function(req,res){

     res.send("Wait , Wait . I am preaching onto sth brah !! ");

        });
  scServer.on('connection', function (socket) {

    // Send an initial image to be drawn to the canvas 

   console.log("Connection Event Recieved Brahhh!!! ");
   globalSocket=socket;

//Write Image file    as buffer and render it onto canvas 
   require("fs").readFile("public/left.jpg",function(err,buffer){
if(err)
console.log("Error ",err);
else{

//check this buffer for Image 
cachedCurrentImage=buffer;
//can use this cachedCurrentImage to read for bufer directly 

//Send The Image to meanshift Code 

//callMeanShiftSegmentation(cachedCurrentImage);


//call The async version 

segmentImageAsync(cachedCurrentImage);


//globalSocket.emit("imageBuffer",cachedCurrentImage);

}

});

    // Some sample logic to show how to handle client events,
    // replace this with your own logic

  socket.on('magicTouch',function(bundle){

 // sp = new mslearn.SegProc(cachedCurrentImage, cachedCurrentImage.length);
        console.log("Point X is ",bundle.x);
        console.log("Point Y is ",bundle.y);
let nc = sp.columns();
        console.log("NC",nc);
let pixels_clicked = new Int32Array([bundle.y*nc+bundle.x]);
    let color_chosen = new Uint8Array([228, 0, 0]);
    sp.mergeAsync(pixels_clicked, pixels_clicked.length, color_chosen, color_chosen.length,
                  (err, segmented_image) => {
                    if(err) {
                      console.log(err);
                    } else {
                        console.log("Segment labelling Finished ");
                        cachedCurrentImage=segmented_image;
globalSocket.emit("imageBuffer",cachedCurrentImage);
                    }
                  }
                 );

});

    socket.on('data',function(bundledData){


console.log("Recieved Bundled Data ");
if(bundledData.type=='rectangle'){
 
//TODO : DO The Rectangle Completion Task 

}else if(bundledData.type=='circle'){


segmentComponentsCircle(bundledData.startY,bundledData.startX,bundledData.radius);


} else if(bundledData.type=='pencil'){
//baseX, baseY , scale , points

segmentComponentFreeForm(bundledData.points);

}


});

  });
};

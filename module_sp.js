const Promise = require('bluebird');
const mslearn = require('../../newtouchMeanShift/MSlearn/cpp/build/Release/mslearn');

exports.get_sp = (img) => { let sp = new mslearn.SegProc(img, img.length); return sp; }


const cassandra = require('cassandra-driver');
const Tuple=require('cassandra-driver').types.Tuple;
const fs=require("fs");

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



async function quickCassandra(){

await client.connect();

let query_s = 'SELECT * FROM labelingapp.imagestorage WHERE user_id=? and dataset_name=? and imageid=?';

let userId='as131123';
let userDataBase='test_db';
let imageId='23d619ac-ef7f-4976-9bd4-61a0b132e33c';
let param_s = [userId,userDataBase,imageId];


let result=await client.execute(query_s,param_s,{ prepare: true });

console.log("Results Count ",result.rows.length);
console.log(result.rows[0].imageblob);

}

quickCassandra();

//});



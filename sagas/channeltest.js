import {call, cps, take, put, fork } from 'redux-saga/effects'
import { socketEmit, createChannelSubscription } from 'redux-saga-sc'



export function *watchChannelExchange(socket,exchange){

while(true){

const message=yield take('CONNECTION'); // OPERATION IS THE MESSAGE , Not Channel Remember 


console.log("Got Socket id ",socket.id);
//Probably should return that particular   to the connection 
let count=0;

const socketIdReply={
type:'CONNECTID',
payload:socket.id
}

try{
yield put(socketEmit(socketIdReply));
}catch(error){
console.error('Caught during socketEmit',error)
}




while(true){
const channel=yield take(socket.id);


//Now create a  Channel subscription of  the id 
//const chan=yield call(createChannelSubscription,exchange,socket.id);

//const  communicate=yield take(chan);

console.log("Communication Event Recieveed ");

count++;
console.log("Coount variable is ",count);


yield put(socketEmit({type:'TRUEREPLY'}));

}

}


}

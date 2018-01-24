import { watchEmits, watchRemote } from 'redux-saga-sc'
import { watchOperations } from './operations';
//import {watchChannelExchange} from './channeltest';

export default function *sagas(socket, exchange) {
  yield [
    watchOperations(socket,exchange),
    watchEmits(socket),
    watchRemote(socket),
  ]
}


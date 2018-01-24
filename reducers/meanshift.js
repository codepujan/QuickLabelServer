let storespCache="STORE_SP_CACHE";
export const meanshift=(state={},action) => {
  switch (action.type) {

  case storespCache:{
  console.log("Storing CP Cache",action.payload);

	return Object.assign({},action.payload);
}
        default:
        return state;
  }
}


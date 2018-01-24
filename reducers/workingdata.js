let initialstate="someInitialImage";

let changeOperatingImage="CHANGE_OPERATING_IMAGE";
export const workingdata=(state=initialstate,action) => {
  switch (action.type) {
  case changeOperatingImage:{
  console.log("Working Image Changed ");  
  return action.payload
	}
	default:
	return state;
  }
}


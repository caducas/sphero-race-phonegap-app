
function getDirection(x,y) {
  // var x = data[0];
  // var y = data[1];


  var divider = Math.abs(y) + Math.abs(x);
  var directionPercentage = 90/divider;

  if(y>0) {
    //forward
    //get divider
    //subtract divider from 360 (if left)
    if(x<0) {
      //left
      return 360-(directionPercentage*Math.abs(x));
    }
    if(x>0) {
      //right
      return 0+(directionPercentage*Math.abs(x));
    }
    return 0;
    //add devider to 0 if right
  }
  if(y<0) {
    if(x>0) {
      return 180-(directionPercentage*Math.abs(x));
    }
    if(x<0) {
      return 180+(directionPercentage*Math.abs(x));
    }
    return 180;
    //backward
  }
  return 180;
}

function getSpeed(x,y) {
  if(y === 0 && x === 0) {
    return 0;
  }
  var speed = (Math.abs(y) + Math.abs(x))*2;
  if(speed < 200) {
    return speed;
  }
  return 200;
}


if(typeof exports !== 'undefined') {
  exports.getDirection = getDirection;
  exports.getSpeed = getSpeed;
}
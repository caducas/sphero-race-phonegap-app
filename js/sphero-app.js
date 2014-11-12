// var socket = io.connect({
// 	'reconnection': true,
// 	'reconnectionDelay': 500,
// 	'reconnectionDelayMax': 1000});
var socket = io('http://10.0.0.189:4000');
// var socket = io('http://192.168.42.1:4000');
var selectPlayerTimeout;


function testVibrate() {

	alert("should now vibrate");
	try {
	navigator.notification.vibrate(1000);

	} catch(err) {
		alert(err);
	}
}

document.addEventListener("deviceready", testVibrate, false);

goToHomeArea();

// socket.on('error', function(){
// 	alert('should reconnect');
//   socket.socket.reconnect();
// });


// socket.on('connect_error', function(err) {
//   // handle server error here
//   alert('connect_error: should reconnect now');

// });

socket.on('disconnect', function() {
	// alert('disconnect: socket.socket.reconnect');
	// socket.socket.reconnect();
	alert('disconnect: socket.socket.connect');
	// socket.socket.connect();
	// socket = io.connect();
});


// function getTime() {
//     return (new Date()).getTime();
// }

// var lastInterval = getTime();

// function intervalHeartbeat() {
//     var now = getTime();
//     var diff = now - lastInterval;
//     var offBy = diff - 1000; // 1000 = the 1 second delay I was expecting
//     lastInterval = now;

//     if(offBy > 100) { // don't trigger on small stutters less than 100ms
//     	// socket.socket.reconnect();
//     	socket.reconnect();
//     }
// }

// setInterval(intervalHeartbeat, 1000);

// setInterval(connect,2000);

// function connect() {
// 	console.log('trying to connect');
// 	socket2.connect();
// }

function checkConnectionAndReconnect() {
	if (! socket.socket.connected) {
	  socket.connect();
	  return false;
	}
	return true;
}

function selectDevice(deviceNumber) {
	socket.emit('selectDevice', deviceNumber);
	waitingForSelectedPlayerConfirmation();
	// selectPlayerTimeout = setTimeout(function() {
	// 	console.log('should now select player '+ deviceNumber+' again');
	// 	selectDevice(deviceNumber);
	// },2000);

	$('#gameScreen').removeClass('sphero1 sphero2');
	$('#gameScreen').addClass('sphero'+deviceNumber);

	$('#additionalInfo').empty();
	if(deviceNumber == 1) {
		$('#additionalInfo').append('<span>Warte auf zweiten Spieler<br />Du steuerst den <span style="color: #f00">roten</span> Sphero</span>');
	}

	if(deviceNumber == 2) {
		$('#additionalInfo').append('<span>Warte auf zweiten Spieler<br />Du steuerst den <span style="color: #0f0">gr&uuml;nen</span> Sphero</span>');
	}


}

function hideAll() {
	$('#infoScreen').hide();
	$('#inactiveInfoScreen').hide();
	$('#homeScreen').hide();
	$('#gameScreen').hide();
	$('#settingsScreen').hide();
	$('#connectSpherosScreen').hide();
	$('#connectSpherosRunningScreen').hide();
	$('#calibrateSphero1Screen').hide();
	$('#calibrateSphero2Screen').hide();
	$('#gameResultScreen').hide();
	$('#gameMeantimesScreen').hide();
	$('#gameQuizScreen').hide();
	$('#gameQuizResultCorrectScreen').hide();
	$('#gameQuizResultWrongScreen').hide();
	$('#gameInfoScreen').hide();
	$('#alternateControlScreen').hide();
}

function goToHomeArea() {
	hideAll();
	$('#homeScreen').show();	
}

function goToGameArea() {
	hideAll();
	$('#mainInfo').empty();
	$('#mainInfo').append('<span>Bereit</span>');
	// $('#additionalInfo').empty();
	// $('#additionalInfo').append('<span>Warte auf zweiten Spieler</span>');
	$('#infoScreen').show();
}

function goToSettingsArea() {
	hideAll();
	$('#settingsScreen').show();
}


function goToConnectSpherosArea() {
	hideAll();
	$('#connectSpherosScreen').show();
}

function waitingForSelectedPlayerConfirmation() {
	hideAll();
	$('#mainInfo').empty();
	$('#mainInfo').append('<span>Spiel wird vorbereitet</span>');
	$('#additionalInfo').empty();
	$('#additionalInfo').append('<span>Spiel wird gerade vorbereitet, bitte Geduld ...</span>');
	$('#infoScreen').show();
}

function startConnectingSpheros() {
	hideAll();
	socket.emit('connectSpheros');
	$('#connectSpherosRunningScreen').show();
}

function stopConnectingSpheros() {
	socket.emit('connectSpherosStop');
	goToCalibrateSphero1Area();
}

function goToCalibrateSphero1Area() {
	hideAll();
	socket.emit('calibrateSphero', 1);
	$('#calibrateSphero1Screen').show();
}

function stopCalibrationSphero1() {
	if(checkConnectionAndReconnect) {
		socket.emit('calibrateSpheroFinished', 1);	
	}
	goToCalibrateSphero2Area();
}

function goToCalibrateSphero2Area() {
	hideAll();
	socket.emit('calibrateSphero', 2);
	$('#calibrateSphero2Screen').show();
}

function stopCalibrationSphero2() {
	if(checkConnectionAndReconnect) {
		socket.emit('calibrateSpheroFinished', 2);	
		hideAll();
		$('#homeScreen').show();
	}
}


function handleOrientation(event) {
  var x = event.beta/2;  // In degree in the range [-180,180]
  var y = event.gamma; // In degree in the range [-90,90]
  var speedLimit = 50;

  if(alternateControl) {
  	x *= -1;
  	speedLimit = 20;
  }

  
  if(x<-speedLimit) {
    x = -speedLimit;
    console.log('x is now -50');
  }
  if(x>speedLimit) {
    x=speedLimit;
    console.log('x is now 50');
  }
  if(y<-speedLimit) {
    y=-speedLimit;
    console.log('x is now 50');
  }
  if(y>speedLimit) {
    y=speedLimit;
  }

  if(alternateControl) {
  	x = x/3;
  	y = y/3;
  }

  if($('#stopwatch').is(":visible")) {
  	socket.emit('control', getDirection(x,y), getSpeed(x,y));
  }
}


socket.on('gameData', function(data) {
	console.log('gameData');
	console.log(data);
	notificationFromServer(data);
});

socket.on('playerSelected', function(playerNumber) {
	clearTimeout(selectPlayerTimeout);
	goToGameArea();
});

socket.on('restartGameConfirmed', function() {
	goToGameArea();	
})

socket.on('startGame', function() {
	console.log('game should be started');
	hideAll();
	$('#gameScreen').show();
	prepareGame();
});


$('#btnDeviceOne').bind('click', function() {
	selectDevice(1);
});

$('#btnDeviceTwo').bind('click', function() {
	selectDevice(2);
});

$('#btnConnect').bind('click', function() {
	goToConnectSpherosArea();
});

$('#btnCalibrateSphero1').bind('click', function() {
	goToCalibrateSphero1Area();
});

$('#btnCalibrateSphero2').bind('click', function() {
	goToCalibrateSphero2Area();
});

$('#btnFinishConnectSpheros').bind('click', function() {
	stopConnectingSpheros();
});

$('#btnStartConnectSpheros').bind('click', function() {
	startConnectingSpheros();
});

$('#btnStopCalibrationSphero1').bind('click', function() {
	stopCalibrationSphero1();
});

$('#btnStopCalibrationSphero2').bind('click', function() {
	stopCalibrationSphero2();
});


window.addEventListener('deviceorientation', handleOrientation);
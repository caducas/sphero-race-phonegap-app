// var socket = io.connect({
// 	'reconnection': true,
// 	'reconnectionDelay': 500,
// 	'reconnectionDelayMax': 1000});
// var socket = io('http://10.0.0.189:4000');
var socket = io('http://192.168.42.1:4000');
var selectPlayerTimeout;

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
	selectPlayerTimeout = setTimeout(function() {
		console.log('should now select player '+ deviceNumber+' again');
		selectDevice(deviceNumber);
	},2000);
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
	$('#whiteBalanceScreen').hide();
	$('#gameResultScreen').hide();
	$('#gameMeantimesScreen').hide();
	$('#gameQuizScreen').hide();
	$('#gameQuizResultCorrectScreen').hide();
	$('#gameQuizResultWrongScreen').hide();
	$('#gameInfoScreen').hide();
}

function goToHomeArea() {
	hideAll();
	$('#homeScreen').show();	
}

function goToGameArea() {
	hideAll();
	$('#mainInfo').empty();
	$('#mainInfo').append('<span>Bereit</span>');
	$('#additionalInfo').empty();
	$('#additionalInfo').append('<span>Warte auf zweiten Spieler</span>');
	$('#infoScreen').show();
}

function goToSettingsArea() {
	hideAll();
	$('#settingsScreen').show();
}

function goToWhiteBalanceArea() {
	hideAll();
	$('#whiteBalanceScreen').show();
	$('#whiteBalanceRunningInformation').hide();
	$('#whiteBalanceFinished').hide();
	$('#whiteBalanceRunningAnimation').hide();
	$('#whiteBalanceCheckedSymbol').hide();
	$('#whiteBalanceStartInformation').show();
	$('#btnStartWhiteBalance').show();
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
	hideAll();
	socket.emit('connectSpherosStop');
	$('#connectSpherosScreen').show();
}

function startWhiteBalance() {
	$('#whiteBalanceStartInformation').hide();
	$('#btnStartWhiteBalance').hide();
	$('#whiteBalanceRunningInformation').show();
	$('#whiteBalanceRunningAnimation').show();
	$('#btnWhiteBalanceBack').hide();
	setTimeout(function() {
		stopWhiteBalance();
	}, 5000);
	socket.emit('startWhiteBalance');
}

function stopWhiteBalance() {
	socket.emit('stopWhiteBalance');
	$('#whiteBalanceRunningInformation').hide();
	$('#whiteBalanceRunningAnimation').hide();
	$('#whiteBalanceCheckedSymbol').show();
	$('#btnWhiteBalanceBack').show();
	$('#whiteBalanceFinished').show();
}

function goToCalibrateSphero1Area() {
	hideAll();
	socket.emit('calibrateSphero', 1);
	$('#calibrateSphero1Screen').show();
}

function stopCalibrationSphero1() {
	if(checkConnectionAndReconnect) {
		hideAll();
		socket.emit('calibrateSpheroFinished', 1);
		$('#settingsScreen').show();		
	}
}

function goToCalibrateSphero2Area() {
	hideAll();
	socket.emit('calibrateSphero', 2);
	$('#calibrateSphero2Screen').show();
}

function stopCalibrationSphero2() {
	hideAll();
	socket.emit('calibrateSpheroFinished', 2);
	$('#settingsScreen').show();
}


function handleOrientation(event) {
  var x = event.beta/2;  // In degree in the range [-180,180]
  var y = event.gamma; // In degree in the range [-90,90]
  var speedLimit = 50;

  if(alternateControl) {
  	x *= -1;
  	speedLimit = 10;
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
  	x = x/2;
  	y = y/2;
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

$('#btnSettings').bind('click', function() {
	goToSettingsArea();
});

$('#btnWhiteBalance').bind('click', function() {
	goToWhiteBalanceArea();
});

$('#btnConnectSpheros').bind('click', function() {
	goToConnectSpherosArea();
});

$('#btnCalibrateSphero1').bind('click', function() {
	goToCalibrateSphero1Area();
});

$('#btnCalibrateSphero2').bind('click', function() {
	goToCalibrateSphero2Area();
});

$('#btnSettingsBack').bind('click', function() {
	goToHomeArea();
});

$('#btnFinishConnectSpheros').bind('click', function() {
	stopConnectingSpheros();
});

$('#btnConnectSpherosBack').bind('click', function() {
	goToSettingsArea();
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

$('#btnWhiteBalanceBack').bind('click', function() {
	goToSettingsArea();
});

$('#btnStartWhiteBalance').bind('click', function() {
	startWhiteBalance();
});

window.addEventListener('deviceorientation', handleOrientation);
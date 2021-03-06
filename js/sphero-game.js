var countdown;
var quizResultCountdown;
var countdownInterval;
var quizResultCountdownInterval;
var stopWatchInterval;
var offset;
var stopWatchTime = 0.0;
var meantimes = [];
var meantimesOpponent = [];
var questCounter = 0;
var quizQuestions;
var quizMathQuestions;
var quizQuestionCounter = 0;
var quizMathQuestionCounter = 0;
var quizAnswersWrongCounter = 0;
var answersActivated = true;
var alternateControl = false;
var spheroControlActive = false;
var fibreTunnelTimeout;
var otherPlayerDisconnected = false;


$(document).ready(function() {

	window.prepareGame = function() {
		resetGame();
		startGame();
	}

	window.notificationFromServer = function(data) {
		console.log('notification:');
		console.log(data);
		if(data.command === 'fibreTunnelActive') {
			fibreTunnelActive(data.commandData.fibreTunnelId);
		}

		if(data.command === 'fibreTunnelLeft') {
			fibreTunnelLeft(data.commandData.fibreTunnelId);
		}

		if(data.command === 'meantimesOpponent') {
			meantimesOpponent = data.commandData;
			if(meantimesOpponent.length==4) {
				determineGameResult();
				return;
			}
			showMeantimes();
		}

		if(data.command === 'opponentLeftGame') {
			otherPlayerDisconnected = true;
			determineGameResult();
		}

		if(data.command === 'loadQuiz') {
			quizQuestions = data.commandData;
			startQuiz();
		}

		if(data.command === 'loadMathQuiz') {
			quizQuestions = data.commandData;
			startQuiz();
		}
	}
});

function startGame() {
	startCountdown();
}

function resetGame() {
	countdown = 3;
	stopWatchTime = 0.0
	questCounter = 0;
	meantimes = [];
	meantimesOpponent = [];
	otherPlayerDisconnected = false;
	for(var i = 1; i<4; i++) {
		$('#meantime_'+i).empty();
		$('#meantime_'+i+'_difference').empty();
	}
	showMeantimes();
	$('#stopwatch').hide();
	$('#times').hide();
}

function raceFinished() {
	stopStopWatch();
	log('race finished');
	determineGameResult();
	setTimeout(function() {
		stopSphero();
	},500);
}

function determineGameResult() {
	if(meantimes.length == 4 && (meantimesOpponent.length == 4 || otherPlayerDisconnected == true)) {
		hideAll();

		$('#gameResult').empty();
		if(meantimes[3]>meantimesOpponent[3]) {
			$('#gameResult').append('<span>Leider verloren</span>');
		}
		if(meantimes[3]==meantimesOpponent[3]) {
			$('#gameResult').append('<span>Unentschieden</span>');
		}
		if(meantimes[3]<meantimesOpponent[3]) {
			$('#gameResult').append('<span>Gewonnen!</span>');
		}

		$('#gameResultTime').empty();
		$('#gameResultTime').append(parseMillisecondsToTimeString(meantimes[3]));
		$('#gameResultScreen').show();
	}
}

function startCountdown() {
	countdownInterval = setInterval(updateCountdown, 1200);
	refreshCountdown();
}

function updateCountdown() {
	countdown -= 1;
	if(countdown !== 0) {
		refreshCountdown();
	} else {
		stopCountdown();
		spheroControlActive = true;
		startStopWatch();
	}
}

function stopCountdown() {
	clearInterval(countdownInterval);
	countdownInterval = null;
}

function refreshCountdown() {
	$('#countdownTimer').empty();
	$('#countdownTimer').show();
	$('#countdownTimer').append(countdown);
	$('#countdownTimer').fadeOut(1100);
	document.getElementById('sound_beep_short').play();

}

function startStopWatch() {
	$('#stopwatch').show();
	log('race started');
	$('#times').show();
	document.getElementById('sound_beep_high').play();
	offset = Date.now();
	stopWatchInterval = setInterval(updateStopWatch, 1);
}

function updateStopWatch() {
	if(meantimes.length >=4) {
		return;
	}
	calculateTime();
	refreshStopWatch();
}

function stopStopWatch() {
	clearInterval(stopWatchInterval);
	stopWatchInterval = null;
	updateStopWatch();
	showFinalTime();
}



function calculateTime() {
	//current Date/Time
    var now = Date.now();

    //miliseconds between current Date/Time and last Date/Time
    var timeDiff   = now - offset;

    //set offset to current Date/Time to compare next time with future Date/Time
    offset = now;

    //add miliseconds between current and last to the amount of stopwatch miliseconds
    stopWatchTime += timeDiff;
}

function refreshStopWatch() {
    //divide with 1000 to get seconds and miliseconds as comma, convert to string
    var output = stopWatchTime/1000;
    output = output.toString();

    //add 0 if to short to get 3 decimal places
    while(output.length < output.indexOf('.') + 4) {
    	output = output + '0'
    }

    //write the time to the frontend
    $('#stopWatchTime').empty();
    $('#stopWatchTime').append(output);
}

function fibreTunnelActive(tunnelId) {

	clearTimeout(fibreTunnelTimeout);

	tunnelId = parseInt(tunnelId);

	if(tunnelId == 1 && meantimes.length == 0) {
		document.getElementById('sound_beep_short').play();
	}

	if(tunnelId == 2 && meantimes.length == 1) {
		document.getElementById('sound_beep_short').play();
	}

	if(tunnelId == 3 && meantimes.length == 2) {
		// startQuiz('Rätsel');
		deactivateAlternateControl();
		document.getElementById('sound_beep_short').play();
	}

	if(tunnelId-1 == meantimes.length) {
		meantimes.push(stopWatchTime);
		log('tunnel ' + tunnelId + ' passed, meantime '+meantimes.length+':'+stopWatchTime);
	}

	sendMeantimesToOtherPlayer();

	if(meantimes.length >= 4) {
		document.getElementById('sound_beep_high').play();
	}

	showMeantimes();
}

function fibreTunnelLeft(tunnelId) {
	fibreTunnelTimeout = setTimeout(function() {
		if(tunnelId == 1 && questCounter == 0) {
			questCounter++;
			log('loading quiz:Rechenaufgaben');
			loadQuiz('Rechenaufgaben', 'Rechenaufgaben');			
		}
		if(tunnelId == 2 && questCounter == 1) {
			questCounter++;
			log('alternate Control: showing information');
			activateAlternateControl();			
		}
		if(tunnelId == 3 && questCounter == 2) {
			questCounter++;
			log('loading quiz:Raetsel');
			loadQuiz('Raetsel', 'R&auml;tsel');			
		}
		if(meantimes.length >= 4) {
			raceFinished();
		}
	}, 500);
}

function sendMeantimesToOtherPlayer() {

	notification = {
		'command' : 'meantimesOpponent',
		'commandData' : meantimes
	}

	socket.emit('notificationToOtherPlayer', notification);
}

function showMeantimes() {
	for(var i = 0; i<4; i++) {
		var meantimeNumber = parseInt(i)+1;
		if(meantimes.length > i) {
			$('#meantime_'+meantimeNumber).empty();
			$('#meantime_'+meantimeNumber).append(parseMillisecondsToTimeString(meantimes[i]));
		} else {
			$('#meantime_'+meantimeNumber).empty();
			$('#meantime_'+meantimeNumber).append("-:-:-");
		}

	}
	for(var i in meantimes) {
		var meantimeNumber = parseInt(i)+1;
		$('#meantime_'+meantimeNumber).empty();
		$('#meantime_'+meantimeNumber).append(parseMillisecondsToTimeString(meantimes[i]));
	}
	console.log('meantimesOpponent');
	console.log(meantimesOpponent);
	for(var i in meantimesOpponent) {
		console.log('i = '+i);
		var meantimeNumber = parseInt(i)+1;
		var objectId = '#meantime_'+meantimeNumber+'_difference';
		if(i==3) {
			console.log('will use final time id');
			objectId = '#final_time_difference';
		}

		$(objectId).empty();
		$(objectId).removeClass('behind ahead');
		
		if(i<meantimes.length) {
			var difference = meantimes[i]-meantimesOpponent[i];
			console.log('difference:');
			console.log(difference);
			if(difference<0) {
				$(objectId).append('-'+parseMillisecondsToTimeString(difference));
				$(objectId).addClass('ahead');
			} else {
				$(objectId).append('+'+parseMillisecondsToTimeString(difference));
				$(objectId).addClass('behind');
			}
		}
		// if(i==3) {
		// 	identifyWinner();
		// }
	}
}

function showFinalTime() {
	$('#final_time').empty();
	$('#final_time').append(parseMillisecondsToTimeString(meantimes[3]));
}

function goToMeantimesArea() {
	console.log(meantimes);
	console.log(meantimesOpponent);
	hideAll();
	$('#meantimeStatisticTableBody').empty();
	for(i = 0; i<4; i++) {
		$('#meantime_own_'+(i+1)).empty();
		$('#meantime_own_'+(i+1)).append(parseMillisecondsToTimeString(meantimes[i]));
		$('#meantime_opponent_'+(i+1)).empty();
		$('#meantime_opponent_'+(i+1)).append(parseMillisecondsToTimeString(meantimesOpponent[i]));
		var difference = meantimes[i]-meantimesOpponent[i];
		$('#meantime_difference_'+(i+1)).empty();
		$('#meantime_difference_'+(i+1)).removeClass('behind ahead');
		if(meantimes[i]<=meantimesOpponent[i]) {
			$('#meantime_difference_'+(i+1)).append('-' + parseMillisecondsToTimeString(difference));
			$('#meantime_difference_'+(i+1)).addClass('ahead');
		} else {
			$('#meantime_difference_'+(i+1)).append('+' + parseMillisecondsToTimeString(difference));
			$('#meantime_difference_'+(i+1)).addClass('behind');
		}

	}
	$('#gameMeantimesScreen').show();
}

function goToGameResultArea() {
	hideAll();
	$('#gameResultScreen').show();
}

function loadQuiz(nameOfQuiz, htmlNameOfQuiz) {
	quizQuestionCounter = 0;
	quizAnswersWrongCounter = 0;
	hideAll();
	$('#gameInfo').empty();
	$('#gameInfo').append('<span>'+htmlNameOfQuiz+'</span>');
	$('#gameInfoScreen').show();
	//show loading area "loading quiz"
	socket.emit('loadQuiz', nameOfQuiz);
}

function startQuiz(nameOfQuiz) {
	setTimeout(function() {
		hideAll();
		$('#gameQuizScreen').show();
		log('quiz started');
	},2000);
	//set quiz question to question 0
	//randomly mix answers and write to answer buttons
	setQuizQuestion(quizQuestions[quizQuestionCounter]);
}

function setQuizQuestion(questionContainer) {
	$('#quizQuestion').empty();
	$('#quizQuestion').append("<span>"+questionContainer.question+"</span>");
	var answers = getAllPossibleAnswersMixed(questionContainer);
	for(var i = 0; i<4; i++) {
		var btnId = '#btnAnswer'+(i+1);
		$(btnId).empty();
		$(btnId).removeClass('wrong correct');
		$(btnId).append('<span>'+answers[i]+'</span>');
	}
	log('quiz: new question: '+questionContainer.question);
	activateAnswers();
}

function quizAnswer(buttonPressed) {
	if(!answersActivated) {
		return;
	}
	var answerText = buttonPressed[0].textContent;
	if(answerText != quizQuestions[quizQuestionCounter].correctAnswer) {
		quizAnswersWrongCounter++;
		buttonPressed.addClass('wrong');
		document.getElementById('sound_wrong').play();
		deactivateAnswers();
		log('quiz: wrong answer: '+answerText);
		setTimeout(function() {
			activateAnswers();
		},500);
		vibrate(500);
		return;
	}
	document.getElementById('sound_correct').play();
	buttonPressed.addClass('correct');
	vibrate([200,200,200]);
	deactivateAnswers();
	log('quiz: correct answer: '+answerText);

	if(quizQuestionCounter>=3) {
		//continue race with delay (depending on wrong answers)
		setTimeout(function() {
			hideAll();
			if(quizAnswersWrongCounter == 0) {
				$('#gameQuizResultCorrectScreen').show();
				log('quiz: all correct, no penalty');
				setTimeout(function() {
					continueRace();
				},2000);
				return;	
			}

			var penalty = quizAnswersWrongCounter*3;
			$('#gameQuizResultWrongScreen').show();
			$('#quizResultWrongAnswers').empty();
			$('#quizResultWrongAnswers').append('<span>'+quizAnswersWrongCounter+' Falsche!</span>');
			$('#quizResultWrongAnswersDetail').empty();
			$('#quizResultWrongAnswersDetail').append('<span>Du musst '+penalty+' Sekunden warten</span>');
			startQuizResultCountdown(penalty);
		}, 2000);
		return;
	}

	quizQuestionCounter++;

	setTimeout(function() {
		setQuizQuestion(quizQuestions[quizQuestionCounter]);
	},2000);
}

function deactivateAnswers() {
	answersActivated = false;
}

function activateAnswers() {
	answersActivated = true;
}

function startQuizResultCountdown(penalty) {
	quizResultCountdown = penalty+2;
	quizResultCountdownInterval = setInterval(updateQuizResultCountdown, 1000);
	refreshQuizResultCountdown();
	log('quiz: penalty: '+penalty+' seconds');
}

function updateQuizResultCountdown() {
	quizResultCountdown -= 1;
	if(quizResultCountdown !== 0) {
		refreshQuizResultCountdown();
	} else {
		stopQuizResultCountdown();
		continueRace();
	}
}


function stopQuizResultCountdown() {
	clearInterval(quizResultCountdownInterval);
	quizResultCountdownInterval = null;
}

function refreshQuizResultCountdown() {
	// $('#quizResultCountdownTimer').empty();
	// $('#quizResultCountdownTimer').show();
	// $('#quizResultCountdownTimer').append('<span>'+quizResultCountdown+'</span>');
	// $('#quizResultCountdownTimer').fadeOut(900);
	$('#quizResultWrongAnswersDetail').empty();
	$('#quizResultWrongAnswersDetail').append('<span>Du musst '+quizResultCountdown+' Sekunden warten</span>');
}

function continueRace() {
	hideAll();
	$('#gameScreen').show();
	log('quiz: finished, sphero can be controlled again');
}

function getAllPossibleAnswersMixed(questionContainer) {
	var possibleAnswers = [];
	possibleAnswers.push(questionContainer.correctAnswer);
	for(var i in questionContainer.wrongAnswers) {
		possibleAnswers.push(questionContainer.wrongAnswers[i].wrongAnswer);
	}
	shuffle(possibleAnswers);
	return possibleAnswers;
}

function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex ;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

function parseMillisecondsToTimeString(milliseconds) {
	milliseconds = Math.abs(milliseconds);
	var ms;
	var sec;
	var min;
	var returnString;

	ms = milliseconds % 1000;
	ms = Math.floor(ms/100);
	milliseconds /= 1000;
	sec = Math.floor(milliseconds % 60)
	milliseconds /= 60
	min = Math.floor(milliseconds % 60)

	returnString = sec+"."+ms;
	if(min === 0) {
		return returnString;
	}
	returnString = min+":"+returnString;
	return returnString;
}

function activateAlternateControl() {
	stopSphero();
	$('#alternateControlPicture').show();
	$('#times').hide();
	hideAll();
	alternateControl = true;
	$('#alternateControlScreen').show();
	setTimeout(function() {
		hideAll();
		$('#gameScreen').show();
		spheroControlActive = true;
		log('alternate Control: active now');
	},10000);
}

function deactivateAlternateControl() {
	alternateControl = false;
	console.log('alternate control should be deactivated');
	$('#alternateControlPicture').hide();
	$('#times').show();
}

function stopSphero() {
	spheroControlActive = false;
	socket.emit('stopSphero');
}

function vibrate(duration) {
	if(navigator.notification && navigator.nofitication.vibrate) {
		navigator.notification.vibrate(duration);
	}
}

function log(message) {
	socket.emit('log', stopWatchTime + ': '+message);
}

$('#btnMeantimes').bind('click', function() {
	goToMeantimesArea();
});

$('#gameResultBack').bind('click', function() {
	socket.emit('unselectDevice');
	goToHomeArea();
});

$('#gameMeantimesBack').bind('click', function() {
	goToGameResultArea();
});

$('#gameResultAgain').bind('click', function() {
	hideAll();
	socket.emit('restartGame');
	$('#mainInfo').empty();
	$('#mainInfo').append('<span>Bereit</span>');
	$('#additionalInfo').empty();
	$('#additionalInfo').append('<span>Warte auf zweiten Spieler</span>');
	resetGame();
});

$('#btnAnswer1').bind('click', function() {
    var $this = $(this);
	quizAnswer($this);
});

$('#btnAnswer2').bind('click', function() {
    var $this = $(this);
	quizAnswer($this);
});

$('#btnAnswer3').bind('click', function() {
    var $this = $(this);
	quizAnswer($this);
});

$('#btnAnswer4').bind('click', function() {
    var $this = $(this);
	quizAnswer($this);
});

var UI = require('ui');
var Vector2 = require('vector2');
var ajax = require('ajax');
var moment = require('vendor/moment');

var splashScreen = new UI.Window();
var text = new UI.Text({
	position: new Vector2(0, 0),
	size: new Vector2(144, 168),
	text: "Fetching MARC Status info...",
	font: 'GOTHIC_28_BOLD',
	color: 'black',
	textOverflow: 'wrap',
	textAlign: 'center',
	backgroundColor: 'white'
});

splashScreen.add(text);
splashScreen.show();

var morningStop = "Odenton";
var eveningStop = "Washington Union Station";

var getScheduleStatus = function(direction, day, origin, destination, callback) {
	// var url = 'http://marc.mrsharpspoon.com/api/status/' + origin + '/' + destination + '/' + day + '/' + station;
	var url = 'http://marc.mrsharpspoon.com/api/status/' + direction + '/' + day + '/' + origin;
	console.log(url);
	ajax({
		url: url,
		type: 'json'
	},
	function(data) {
		callback(null, data);
	},
	function(error) {
		console.log('Prolem: ' + error);
		callback(true);
	}
	);
};

var createTrainStatusMenu = function(direction, day, origin, destination, callback) {
	getScheduleStatus(direction, day, origin, destination, function(err, results) {
		var schedule = results.schedule;
		var stop, delayText;
		var currentTrainsMenu = new UI.Menu({
			sections: [
				{
					title: direction + ' ' + origin + ' Trains',
					items: formatTrains(results.schedule)
				}
			]
		});
		callback(currentTrainsMenu);
	});
};

function formatTrains(trainsStatus) {
	var results = [];
	for (var x = 0; x < trainsStatus.length; x++) {
		delayText = formatDelay(trainsStatus[x]);
		results.push({
			title:  moment(trainsStatus[x].time).format('h:mm a') + delayText,
			number: trainsStatus[x].trainNum
		});
	}
	return results;
}

function formatDelay(trainStop) {
	var result = '';
	if (trainStop.delay) {
		console.log(JSON.stringify(trainStop));
		result = trainStop.delay === '' ? ' (On Time' : ' (' + trainStop.delay + 'min';
		if (trainStop.delay && !trainStop.lastUpdate) {
			result += '?';
		}
		result += ')';
	}
	return result;
}

function showMorningMenu(day) {
	var updateTimeout;
	createTrainStatusMenu('south', day, morningStop, eveningStop, function(southMenu) {
		southMenu.on('longSelect', function() {
			clearInterval(updateTimeout);
			createTrainStatusMenu('north', day, eveningStop, morningStop, function(northMenu) {
				northMenu.on('hide', function() {
					console.log('hiding north menu');
				});
				northMenu.on('show', function() {
					updateTimeout = startUpdating(northMenu, 'north', day, eveningStop, morningStop);
				});
				northMenu.show();
			});
		});
		southMenu.on('show', function() {
			clearInterval(updateTimeout);
			console.log('showing south menu');
			updateTimeout = startUpdating(southMenu, 'south', day, morningStop, eveningStop);
		});
		southMenu.show();
		splashScreen.hide();
	});
}

function startUpdating(menu, dir, day, origin, destination) {
	console.log("in startupdating, outside of timeout");
	return setInterval(function() {
		console.log("calling timeout!");
		getScheduleStatus(dir, day, origin, destination, function(err, scheduleStatus) {
			menu.items(0, formatTrains(scheduleStatus.schedule));
		});
	}, 60000);
}

function showEveningMenu(day) {
	createTrainStatusMenu('north', day, eveningStop, morningStop, function(northMenu) {
		northMenu.on('longSelect', function() {
			createTrainStatusMenu('south', day, morningStop, eveningStop, function(southMenu) {
				southMenu.show();
			});
		});
		northMenu.show();
		splashScreen.hide();
	});
}

function showInitialMenu() {
	var curTime = moment();
	var day = curTime.format('dddd');
	if (curTime.hour() < 12) {
		showMorningMenu(day);
	} else {
		showMorningMenu(day);
	}
}

showInitialMenu();

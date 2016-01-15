/**
 * Welcome to Pebble.js!
 *
 * This is where you write your app.
 */

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

var getScheduleStatus = function(direction, day, station, callback) {
	var url = 'http://marc.mrsharpspoon.com/api/status/' + direction + '/' + day + '/' + station;
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

var createTrainStatusMenu = function(direction, day, station, callback) {
	getScheduleStatus(direction, day, station, function(err, results) {
		var schedule = results.schedule;
		var stop, delayText;
		var trains = [];
		for (var x = 0; x < schedule.length; x++) {
			delayText = '';
			if (schedule[x].delay) {
				delayText = schedule[x].delay === '' ? ' (On Time)' : ' (' + schedule[x].delay + ' Delay)';
			}
			trains.push({
				title:  moment(schedule[x].time).format('h:mm a') + delayText
			});
		}
		var currentTrainsMenu = new UI.Menu({
			sections: [
				{
					title: direction + ' ' + station + ' Trains',
					items: trains
				}
			]
		});
		callback(currentTrainsMenu);
	});
};

var curTime = moment();
if (curTime.hour() < 12) {
	createTrainStatusMenu('south', curTime.format('dddd'), morningStop, function(southMenu) {
		southMenu.on('longSelect', function() {
			createTrainStatusMenu('north', curTime.format('dddd'), eveningStop, function(northMenu) {
				northMenu.show();
			});
		});
		southMenu.show();
		splashScreen.hide();
	});
} else {
	createTrainStatusMenu('north', curTime.format('dddd'), eveningStop, function(northMenu) {
		northMenu.on('longSelect', function() {
			createTrainStatusMenu('south', curTime.format('dddd'), morningStop, function(southMenu) {
				southMenu.show();
			});
		});
		northMenu.show();
		splashScreen.hide();
	});
}

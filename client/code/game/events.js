'use strict';

var $events = $game.$events = module.exports = {

	registerVariables: function() {
		// Blank
	},

	init: function() {

		/******* RPC EVENTS *********/

		// new player joining to keep track of
		ss.event.on('ss-addPlayer', function(data, chan) {
			$game.$others.add(data.info);
			if(data.info._id !== $game.$player.id) {
				$game.statusUpdate({
					message: data.info.firstName + ' has joined!',
					input:'status',
					screen: true,
					log: true
				});
			}
		});

		//player removing
		ss.event.on('ss-removePlayer', function(data, chan) {
			if(data.id != $game.$player.id) {
				$game.$others.remove(data.id);
			}
		});

		//player moves
		ss.event.on('ss-playerMoved', function(data, chan) {
			if(data.id != $game.$player.id) {
				$game.$others.sendMoveInfo(data.moves, data.id);
			}
		});

		//new tile color bomb
		ss.event.on('ss-seedDropped', function(data, chan) {
			$game.$map.newBomb(data.bombed, data.id);
			if($game.$player.id !== data.id) {
				$game.$others.updateTilesColored(data.id, data.tilesColored);
			}
		});

		//new message from chat
		ss.event.on('ss-newMessage', function(data, chan) {
			//put in log for everyone
			data.input = 'chat';
			if($game.$player.firstName === data.name) {
				$game.$chat.message(data);
			} else {
				$game.$others.message(data);
			}

		});

		ss.event.on('ss-statusUpdate', function(data, chan) {
			// $game.temporaryStatus(data);
			// console.log('TODO lol');
		});

		ss.event.on('ss-progressChange', function(data, chan) {
			$game.updatePercent(data.dropped);
		});

		ss.event.on('ss-leaderChange', function(data, chan) {
			$game.updateLeaderboard(data);
		});

		ss.event.on('ss-addAnswer', function(data, chan) {
			$game.$resources.addAnswer(data);
		});

		ss.event.on('ss-removeAnswer', function(data, chan) {
			$game.$resources.removeAnswer(data);
		});

		//level change for a player
		ss.event.on('ss-levelChange', function(data, chan) {
			$game.$others.levelChange(data.id, data.level);
		});

		//some one pledged a seed to someone's answer
		ss.event.on('ss-seedPledged', function(data, chan) {
			if($game.$player.id === data.id) {
				$game.statusUpdate({message: data.pledger  + ' liked a response of yours. Here, have some seeds.',input:'status',screen: true,log:true});
				$game.$player.updateSeeds('regular', 3);
				$game.$player.updateResource(data);
			}
		});

		//the game meter has hit the end, boss mode is unlocked
		ss.event.on('ss-bossModeUnlocked', function() {
			$game.bossModeUnlocked = true;
			if($game.$player.currentLevel > 3) {
				$game.toBossLevel();
			}
		});

		//another player has beamed
		ss.event.on('ss-beam', function(info) {
			if(info.id !== $game.$player.id) {
				$game.$others.beam(info);
			}
		});

		ss.event.on('ss-collaborativeChallenge', function(info) {
			for(var i = 0; i < info.players.length; i++) {
				if(info.players[i] === $game.$player.id) {
					//TODO add seeds
					$game.statusUpdate({message: 'Nice work you did a collaborative challenge! Have ' + info.seeds + ' paintbrush seeds.',input:'status', screen:true, log:true});
					$game.$player.updateSeeds('draw', info.seeds, true);
					break;
				}
			}
		});

		ss.event.on('ss-skinSuitChange', function(info) {
			if(info.id !== $game.$player.id) {
				$game.$others.skinSuitChange(info);
			}
		});
	}

};
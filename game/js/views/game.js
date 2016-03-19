'use strict';

var PIXI = require('pixi.js');
var walls = require('../data/maze').walls;
var goal = require('../data/maze').goal;
var each = require('lodash').each;
var reduce = require('lodash').reduce;
var first = require('lodash').first;
var filter = require('lodash').filter;
var take = require('lodash').take;
var sortBy = require('lodash').sortBy;
var numeral = require('numeral');
var shapeSpecificProperties = require('../values/shape-specific-properties');

//jshint maxparams:false
module.exports = {
  type: 'OnClientReady',
  deps: ['Config', 'StateTracker', 'DefinePlugin', 'CurrentState', 'CurrentServerState', '$', 'PhysicsSystem'],
  func: function View (config, tracker, define, currentState, currentServerState, $) {

    var overlay = require('../../views/overlays/amazing.jade');

    function sortChildren (stage) {
      stage.children.sort(function(a,b) {
          return (b.zIndex || 0) - (a.zIndex || 0);
      });
    }

    function createBoard () {
      var shape = new PIXI.Graphics();
      shape.beginFill(0x38806F);
      shape.drawRect(0, 0, 520, 520);
      shape.zIndex = 10000;

      return shape;
    }

    function createWall (wall) {
      var shape = new PIXI.Graphics();
      shape.beginFill(0xFFFFFF);
      shape.drawRect(wall.position.x, wall.position.y, wall.width, wall.height);
      shape.zIndex = 1000;

      return shape;
    }

    function createGoal (goal) {
      var shape = new PIXI.Graphics();
      shape.beginFill(0xAAAAAA);
      shape.drawRect(goal.position.x, goal.position.y, goal.width, goal.height);
      shape.zIndex = 1000;

      return shape;
    }

    function createCircle (avatar, colour) {
      var shape = new PIXI.Graphics();
      shape.beginFill(colour || avatar.colour);
      shape.drawCircle(0, 0, shapeSpecificProperties.circle.radius);
      shape.position.x = avatar.position.x;
      shape.position.y = avatar.position.y;
      shape.zIndex = 1;

      return shape;
    }

    function createSquare (avatar, colour) {
      var l = shapeSpecificProperties.square.length;

      var shape = new PIXI.Graphics();
      shape.beginFill(colour || avatar.colour);
      shape.drawRect(0, 0, l, l);
      shape.position.x = avatar.position.x;
      shape.position.y = avatar.position.y;
      shape.zIndex = 1;

      return shape;
    }

    var shapeMakers = {
      'circle': createCircle,
      'square': createSquare,
    };

    function createAvatar (avatar, colour) {
      return shapeMakers[avatar.shape](avatar, colour);
    }

    function addCorpse (id, corpse, stage) {
      var shape = createAvatar(corpse, 0x333333);
      shape.zIndex = 10;

      stage.addChild(shape);
      sortChildren(stage);
    }

    var avatars = {};
    function addAvatar (id, player, stage) {
      avatars[id] = createAvatar(player.amazing.avatar);

      stage.addChild(avatars[id]);
    }

    function moveAvatar (id, player) {
      avatars[id].position.x = player.amazing.avatar.position.x;
      avatars[id].position.y = player.amazing.avatar.position.y;
    }

    function updateDeaths (players) {
      var deaths = reduce(players, function (total, player) {
        return total += (player.amazing.deaths || 0);
      }, 0);

      $()('#deaths').text(deaths);
    }

    var player;
    function updateTime (players) {
      var thisPlayer = first(filter(players, {id: player}));

      if (thisPlayer) {
        $()('#time').text(numeral(thisPlayer.amazing.time).format('0.000'));
      }
    }

    function getFullLeaderboard (players) {
      var leaderboard = [];

      each(players, function (player) {
        leaderboard = leaderboard.concat(player.amazing.times);
      });

      return sortBy(leaderboard, 'duration');
    }

    function addTimeToLeaderboard (players) {
      var leaderboard = getFullLeaderboard(players);
      var top10 = take(leaderboard, 10);

      each(leaderboard, function (entry) {
        var id = '#leaderboard-entry-' + entry.id;
        $()(id).remove();
      });

      each(top10, function (entry) {
        var id = '#leaderboard-entry-' + entry.id;

        if ($()(id).length > 0) {
          return;
        }

        var time = numeral(entry.duration).format('0.000');
        $()('#leaderboard').append(
          '<li id="leaderboard-entry-' + entry.id + '">' + time + '</li>'
        );
      });
    }

    var stage;

    function boardIsSmallerThenScreen(boardDimensions, screenDimensions) {
      return (boardDimensions.width < screenDimensions.usableWidth ||
          boardDimensions.height < screenDimensions.usableHeight);
    }

    function boardIsLargerThanScreen(boardDimensions, screenDimensions) {
      return !boardIsSmallerThenScreen(boardDimensions, screenDimensions);
    }

    function calculateOffset (boardDimensions, screenDimensions) {
      if (boardIsSmallerThenScreen(boardDimensions, screenDimensions)) {
        return {
          x: (screenDimensions.usableWidth - boardDimensions.width) / 2,
          y: (screenDimensions.usableHeight - boardDimensions.height) / 2
        };
      } else {
        return { x: 0, y: 0 };
      }
    }

    function scaleBoard (dims) {
      if (boardIsLargerThanScreen(config().amazing.board, dims)) {
        var ratio = Math.min(
          dims.screenWidth/config().amazing.board.width,
          dims.screenHeight/config().amazing.board.height
        );

        return {
          x: ratio,
          y: ratio
        };
      } else {
        return {
          x: 1.0,
          y: 1.0
        };
      }
    }

    var offset;
    var scale;
    return function setup (dims, playerId) {
      player = playerId;

      $()('#overlay').append(overlay());

      stage = new PIXI.Container();
      var renderer = PIXI.autoDetectRenderer(dims.usableWidth, dims.usableHeight);
      $()('#' + config().client.element).append(renderer.view);

      offset = calculateOffset(config().amazing.board, dims);
      stage.position.x = offset.x;
      stage.position.y = offset.y;
      scale = scaleBoard(dims);
      stage.scale.x = scale.x;
      stage.scale.y = scale.y;

      stage.addChild(createBoard());

      each(walls, function(wall) {
        stage.addChild(createWall(wall));
      });

      each(goal, function(part) {
        stage.addChild(createGoal(part));
      });

      tracker().onElementAdded('players', addAvatar, [stage]);
      tracker().onElementChanged('players', moveAvatar);
      tracker().onElementAdded('amazing.corpses', addCorpse, [stage]);
      tracker().onChangeOf('players', addTimeToLeaderboard);
      tracker().onChangeOf('players', updateDeaths);
      tracker().onChangeOf('players', updateTime);

      define()('OnPlayerGroupChange', function OnPlayerGroupChange () {
        return function hideOfflinePlayers (players) {
          each(filter(players, {status: 'offline'}), function (player) {
            if (avatars[player.number]) {
              avatars[player.number].visible = false;
            }
          });
          each(filter(players, {status: 'online'}), function (player) {
            if (avatars[player.number]) {
              avatars[player.number].visible = true;
            }
          });
        };
      });

      define()('OnRenderFrame', function OnRenderFrame () {
        return function renderScene () {
          renderer.render(stage);
        };
      });

      // define()('OnResize', function OnResize () {
      //   return function resizeBoard (dims) {
      //     renderer.resize(dims.usableWidth, dims.usableHeight);

      //     scale = scaleBoard(dims);
      //     stage.scale.x = scale.x;
      //     stage.scale.y = scale.y;
      //   };
      // });
    };
  }
};
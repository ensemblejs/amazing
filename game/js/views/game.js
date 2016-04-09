'use strict';

var PIXI = require('pixi.js');
var walls = require('../data/maze').walls;
var goal = require('../data/maze').goal;
var each = require('lodash').each;
var reduce = require('lodash').reduce;
var filter = require('lodash').filter;
var take = require('lodash').take;
var sortBy = require('lodash').sortBy;
var map = require('lodash').map;
var numeral = require('numeral');
var shapeSpecificProperties = require('../values/shape-specific-properties');

//jshint maxparams:false
module.exports = {
  type: 'OnClientReady',
  deps: ['Config', 'StateTracker', 'DefinePlugin', 'CurrentState', 'CurrentServerState', '$', 'PhysicsSystem'],
  func: function View (config, tracker, define, currentState, currentServerState, $) {

    //require('ensemblejs/views').overlay('amazing');
    var overlay = require('../../views/overlays/amazing.pug');
    //require('ensemblejs/views').partial('leaderboard-entry');
    var leaderboardEntry = require('../../views/partials/leaderboard-entry.pug');

    // Utility function, move out to pixijs-support
    function sortChildren (stage) {
      stage.children.sort(function(a,b) {
          return (b.zIndex || 0) - (a.zIndex || 0);
      });
    }

    //Game assets, work out how to structure this stuff
    //?? var assets = require('ensemblejs/assets');
    //?? var board = assets.load('board');
    //?? var wall = assets.load('wall');
    //?? var goal = assets.load('goal');
    //?? var circle = assets.load('circle');
    // -> this goes and tries to find a registered asset
    // assets.define('board', () => {
    //   var shape = new PIXI.Graphics();
    //   shape.beginFill(0x38806F);
    //   shape.drawRect(0, 0, 520, 520);
    //   shape.zIndex = 10000;

    //   return shape;
    // });

    function createBoard () {
      var shape = new PIXI.Graphics();
      //MOVE colours into a supported feature:
      //var colours = require('ensemblejs/colours')
      //var colors = require('ensemblejs/colors')
      //shape.beginFill(colours.board);
      //The colours are picked up from a colours.json file (probably automatically filtered by modes)
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

    //view specific code
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

    //lens, pull this out
    function deaths (state) {
      return reduce(state.players, function (total, player) {
        return total += (player.amazing.deaths || 0);
      }, 0);
    }

    function updateDeaths (current) {
      $()('#deaths').text(current);
    }

    function updateTime (time) {
     $()('#time').text(numeral(time).format('0.000'));
    }

    //lens, pull this out
    function getFullLeaderboard (players) {
      var leaderboard = [];

      each(players, function (player) {
        leaderboard = leaderboard.concat(player.amazing.times);
      });

      return map(sortBy(leaderboard, 'duration'), (entry, index) => {
        entry.position = index + 1;
        return entry;
      });
    }

    //lens, pull this out
    function leaderboard (state) {
      return take(getFullLeaderboard(state.players), 10);
    }

    function addTimeToLeaderboard (id, entry) {
        var time = numeral(entry.duration).format('0.000');

        if (entry.position === 1) {
          $()('#leaderboard').prepend(leaderboardEntry({id: id, time: time}));
        } else {
          $()(leaderboardEntry({id: id, time: time})).insertAfter(
            `#leaderboard > div[order="${entry.position - 1}"]`
          );
        }
        $()(`#leaderboard-entry-${id}`).attr('order', entry.position);
    }

    function moveTimeInLeaderboard (id, entry) {
      $()(`#leaderboard-entry-${id}`).attr('order', entry.position);
    }

    function removeTimeFromLeaderboard (id) {
      $()(`#leaderboard-entry-${id}`).remove();
    }

    //Screen Stuff, pull out
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

    //Setup, pull out Pixi stuff.
    var stage;
    var offset;
    var scale;
    return function setup (dims, playerId) {
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
      tracker().onElement(leaderboard, addTimeToLeaderboard, moveTimeInLeaderboard, removeTimeFromLeaderboard);
      tracker().onChangeOf(deaths, updateDeaths);
      tracker().onChangeOf(`players:${playerId}.amazing.time`, updateTime);

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

      // Screen stuff, pull out.
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
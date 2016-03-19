'use strict';

var map = require('lodash').map;

module.exports = {
  type: 'OnPhysicsFrame',
  func: function OnPhysicsFrame () {
    return function updateTime (delta, state) {
      return [
        'players', map(state.unwrap('players'), function (player) {
          var time = player.amazing.time;

          player.amazing.time = time === 'not-started' ? time : time += delta;
          return player;
        })
      ];
    };
  }
};
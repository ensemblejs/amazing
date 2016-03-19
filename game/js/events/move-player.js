'use strict';

var map = require('lodash').map;
var add = require('distributedlife-sat').vector.add;
var scale = require('distributedlife-sat').vector.scale;

function p(id, path) {
  return 'players:' + id + '.' + path;
}

module.exports = {
  type: 'OnPhysicsFrame',
  deps: ['Config'],
  func: function Amazing (config) {
    return function (delta, state) {
      return map(state.unwrap('players'), function (player) {
        var position = player.amazing.avatar.position;
        var velocity = player.amazing.avatar.velocity;
        var speed = config().amazing.avatar.speed;

        var newPosition = add(position, scale(velocity, speed * delta));

        return [
          p(player.id, 'amazing.avatar.position'), newPosition
        ];
      });
    };
  }
};
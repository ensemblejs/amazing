'use strict';

var merge = require('lodash').merge;
var shapeSpecificProperties = require('../values/shape-specific-properties');

function avatar (player) {
  var avatar = {
    id: player.id
  };

  merge(avatar, player.amazing.avatar);
  merge(avatar, shapeSpecificProperties[player.amazing.avatar.shape]);

  return avatar;
}

function corpse (state) {
  var corpse = {
    id: state.id
  };

  merge(corpse, state);
  merge(corpse, shapeSpecificProperties[state.shape]);

  return corpse;
}

module.exports = {
  type: 'PhysicsMap',
  func: function () {
    return {
      walls: require('../data/maze.json').walls,
      goal: require('../data/maze.json').goal,
      corpses: [{ sourceKey: 'amazing.corpses', via: corpse}],
      avatars: [{ sourceKey: 'players', via: avatar}]
    };
  }
};
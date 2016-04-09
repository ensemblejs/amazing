'use strict';

var next = require('distributedlife-sequence').next;

function p(id, path) {
  return 'players:' + id + '.' + path;
}

function increment (current) {
  return current + 1;
}

function upDeathCount (delta, state, metadata) {
  return [
    p(metadata.avatars.target.id, 'amazing.deaths'), increment
  ];
}

function addCorpse (delta, state, metadata) {
  var avatar = state.unwrap(p(metadata.avatars.target.id, 'amazing.avatar'));

  var corpse = {
    id: next('corpse'),
    position: avatar.position,
    shape: avatar.shape
  };

  return ['amazing.corpses+', corpse];
}

function respawn (delta, state, metadata) {
  return [
    [p(metadata.avatars.target.id, 'amazing.avatar.position'), {x: 50, y: 50}],
    [p(metadata.avatars.target.id, 'amazing.avatar.velocity'), {x: 0, y: 0}],
    [p(metadata.avatars.target.id, 'amazing.time'), 'not-started']
  ];
}

function storeDuration (delta, state, metadata) {
  var time = {
    id: next('score'),
    playerId: metadata.avatars.target.id,
    duration: state.get(p(metadata.avatars.target.id, 'amazing.time'))
  };

  return [
    p(metadata.avatars.target.id, 'amazing.times+'), time
  ];
}

module.exports = {
  type: 'CollisionMap',
  func: function () {
    return {
      'avatars': [
        { and: ['walls'], start: [upDeathCount, addCorpse, respawn] },
        { and: ['goal'], start: [storeDuration, respawn] }
      ]
    };
  }
};
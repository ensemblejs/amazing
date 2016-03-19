'use strict';

function p(id, path) {
  return 'players:' + id + '.' + path;
}

function up (state, force, data) {
  return [p(data.playerId, 'amazing.avatar.velocity'), {x: 0, y: -1}];
}

function down (state, force, data) {
  return [p(data.playerId, 'amazing.avatar.velocity'), {x: 0, y: +1}];
}

function left (state, force, data) {
  return [p(data.playerId, 'amazing.avatar.velocity'), {x: -1, y: 0}];
}

function right (state, force, data) {
  return [p(data.playerId, 'amazing.avatar.velocity'), {x: +1, y: 0}];
}

function move (state, x, y, data) {
  var position = state.unwrap(p(data.playerId, 'amazing.avatar.position'));
  var relativeX = x - position.x;
  var relativeY = y - position.y;

  if (Math.abs(relativeX) > Math.abs(relativeY)) {
    return (relativeX > 0) ? right(state, 1, data) : left (state, 1, data);
  } else {
    return (relativeY < 0) ? up(state, 1, data) : down (state, 1, data);
  }
}

function startTimer (state, force, data) {
  if (state.get(p(data.playerId, 'amazing.time')) >= 0) {
    return;
  }

  return [p(data.playerId, 'amazing.time'), 0];
}

function startTimerTouch (state, x, y, data) {
  if (state.get(p(data.playerId, 'amazing.time')) >= 0) {
    return;
  }

  return [p(data.playerId, 'amazing.time'), 0];
}

module.exports = {
  type: 'ActionMap',
  func: function Amazing () {
    return {
      up: [
        {call: startTimer, onRelease: true}, {call: up, onRelease: true}
      ],
      down: [
        {call: startTimer, onRelease: true}, {call: down, onRelease: true}
      ],
      left: [
        {call: startTimer, onRelease: true}, {call: left, onRelease: true}
      ],
      right: [
        {call: startTimer, onRelease: true}, {call: right, onRelease: true}
      ],
      touch0: [
        {call: startTimerTouch, onRelease: true}, {call: move, onRelease: true}
      ]
    };
  }
};
'use strict';

module.exports = {
  type: 'PlayerStateSeed',
  deps: ['Config'],
  func: function Amazing (config) {

    function nextShape (id) {
      return config().amazing.shapes[id % config().amazing.shapes.length];
    }

    function nextColour (id) {
      return config().amazing.colours[id % config().amazing.colours.length];
    }

    return function seedPlayerState (playerId) {
      return {
        amazing: {
          avatar: {
            shape: nextShape(playerId),
            colour: nextColour(playerId),
            position: {x: 50, y: 50},
            velocity: {x: 0, y: 0}
          },
          deaths: 0,
          times: [],
          time: 'not-started'
        }
      };
    };
  }
};
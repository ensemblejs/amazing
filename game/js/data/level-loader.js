'use strict';

var each = require('lodash').each;

const gridSize = 10;

function parseCell (rowIndex, colIndex) {
  return {
    'position': {'x': colIndex * gridSize, 'y': rowIndex * gridSize},
    'width': gridSize,
    'height': gridSize
  };
}

function parsePoint (rowIndex, colIndex) {
  return {
    x: (rowIndex * gridSize) + 1,
    y: (colIndex * gridSize) + 1
  };
}

const parsers = {
  'X': parseCell,
  'G': parseCell,
  'S': parsePoint
};

const legend = {
  'X': 'walls',
  'G': 'goal',
  'S': 'spawn'
};

function levelLoader (fileContents) {
  let level = {
    walls: [],
    spawn: [],
    goal: []
  };

  each(fileContents, (row, rowIndex) => {
    each(row.split(''), (cell, colIndex) => {
      if (cell === ' ') {
        return;
      }

      level[legend[cell]].push(parsers[cell](rowIndex, colIndex));
    });
  });

  return level;
}

module.exports = levelLoader;
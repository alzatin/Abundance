// __mocks__/polygon-packer.js
import {jest} from '@jest/globals';

// Mock implementation for polygon-packer
export const PolygonPacker = jest.fn(() => ({
  pack: jest.fn(() => []), // returns empty array or mock result
}));

export const PlacementWrapper = jest.fn(() => ({
  place: jest.fn(() => []), // returns empty array or mock result
}));

export default {
  PolygonPacker,
  PlacementWrapper,
};

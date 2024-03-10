import { ISpinner } from '.';

const mockSpinner: ISpinner = {
  start: jest.fn(),
  stop: jest.fn(),
  succeed: jest.fn(),
  fail: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  clear: jest.fn(),
  render: jest.fn(),
  destroy: jest.fn(),
};

export default mockSpinner;

import { ILogger } from './index';
import mockSpinner from './spinner.mock';

const mockLogger: ILogger = {
  // Basic logging
  debug: jest.fn() as unknown as (message: string) => void,
  info: jest.fn() as unknown as (message: string) => void,
  warn: jest.fn() as unknown as (message: string) => void,
  error: jest.fn() as unknown as (message: string) => void,
  fatal: jest.fn() as unknown as (message: string) => void,
  succeedIcon: jest.fn() as unknown as (message: string) => void,
  failIcon: jest.fn() as unknown as (message: string) => void,
  warnIcon: jest.fn() as unknown as (message: string) => void,
  infoIcon: jest.fn() as unknown as (message: string) => void,
  spinner: jest.fn().mockImplementation(() => mockSpinner),
};

export default mockLogger;

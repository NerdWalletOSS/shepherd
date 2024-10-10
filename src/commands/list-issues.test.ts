import listIssues from './list-issues.js';
import { IMigrationContext } from '../migration-context.js';
import mockAdapter from '../adapters/adapter.mock.js';
import mockLogger from '../logger/logger.mock.js';
import { getIssueTrackerFile } from '../util/persisted-data.js';

jest.mock('fs-extra', () => {
  return {
    // Mock other methods as needed
    readFile: jest
      .fn()
      .mockResolvedValue(
        '[{"issueNumber": "3", "title": "new title", "owner": "Nerdwallet", "status": "closed", "repo": "shepherd"}]'
      ),
  };
});

jest.mock('../util/persisted-data');

jest.spyOn(process.stdout, 'write').mockImplementation(function () {
  return true;
});
describe('list-issue command', () => {
  let mockContext: IMigrationContext;

  beforeEach(() => {
    jest.clearAllMocks();

    mockContext = {
      shepherd: {
        workingDirectory: 'workingDirectory',
      },
      migration: {
        migrationDirectory: 'migrationDirectory',
        spec: {
          id: 'id',
          title: 'title',
          adapter: {
            type: 'adapter',
          },
          hooks: {},
          issues: {
            title: 'issue title',
            description: 'issue description',
            state: 'open',
            state_reason: 'not_planned',
            labels: ['bug'],
          },
        },
        workingDirectory: 'workingDirectory',
        selectedRepos: [{ name: 'selectedRepos' }],
        repos: [{ name: 'selectedRepos' }],
        upstreamOwner: 'upstreamOwner',
      },
      adapter: mockAdapter,
      logger: mockLogger,
    };
  });

  it('should list issues when the command is invoked', async () => {
    (getIssueTrackerFile as jest.Mock).mockResolvedValueOnce([
      {
        issueNumber: '7',
        title: 'this is my first updated issue',
        owner: 'upstreamOwner',
        status: 'open',
        repo: 'selectedRepos',
      },
      {
        issueNumber: '8',
        title: 'this is my first updated issue',
        owner: 'newOwner1',
        status: 'open',
        repo: 'newRepo1',
      },
    ]);

    await listIssues(mockContext);

    expect(process.stdout.write).toMatchSnapshot();
  });
});

import issue from './issue.js';
import { IMigrationContext } from '../migration-context.js';
import mockAdapter from '../adapters/adapter.mock.js';
import mockLogger from '../logger/logger.mock.js';
import { getIssueListsFromTracker } from '../util/persisted-data.js';
import mockSpinner from '../logger/spinner.mock.js';
import executeSteps from '../util/execute-steps.js';

jest.mock('../util/persisted-data');
jest.mock('../util/execute-steps');
describe('issue command', () => {
  let mockContext: IMigrationContext;
  let mockContext1: IMigrationContext;
  let mockContext2: IMigrationContext;
  let mockContext3: IMigrationContext;
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
          hooks: {
            should_create_issue: [],
          },
          issues: {
            title: 'this is issue',
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
    mockContext1 = {
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
        },
        workingDirectory: 'workingDirectory',
        selectedRepos: [{ name: 'selectedRepos' }],
        repos: [{ name: 'selectedRepos' }],
        upstreamOwner: 'upstreamOwner',
      },
      adapter: mockAdapter,
      logger: mockLogger,
    };
    mockContext2 = {
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
          issues: {},
        },
        workingDirectory: 'workingDirectory',
        selectedRepos: [{ name: 'selectedRepos' }],
        repos: [{ name: 'selectedRepos' }],
        upstreamOwner: 'upstreamOwner',
      },
      adapter: mockAdapter,
      logger: mockLogger,
    };
    mockContext3 = {
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
            title: 'this is issue',
            description: 'issue description',
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

  it('create issue if the issue doesnt exists in tracker', async () => {
    (getIssueListsFromTracker as jest.Mock).mockResolvedValueOnce([
      {
        issueNumber: '7',
        title: 'this is my first updated issue',
        owner: 'newowner',
        repo: 'newrepo',
      },
      {
        issueNumber: '0',
        title: 'this is my first updated issue',
        owner: 'newowner4',
        repo: 'newrepo4',
      },
    ]);

    (executeSteps as jest.Mock).mockResolvedValueOnce({
      succeeded: true,
      stepResults: [],
    });

    await issue(mockContext);

    expect(mockContext.adapter.createIssue).toHaveBeenCalled();
  });

  it('create issue if the issue doesnt exists in tracker', async () => {
    (getIssueListsFromTracker as jest.Mock).mockResolvedValueOnce([
      {
        issueNumber: '7',
        title: 'this is my first updated issue',
        owner: 'newowner',
        repo: 'newrepo',
      },
      {
        issueNumber: '0',
        title: 'this is my first updated issue',
        owner: 'newowner4',
        repo: 'newrepo4',
      },
    ]);

    (executeSteps as jest.Mock).mockResolvedValueOnce({
      succeeded: false,
      stepResults: [],
    });

    await issue(mockContext);

    expect(mockContext.adapter.createIssue).not.toHaveBeenCalled();
  });

  it('update issue if the issue exists in tracker', async () => {
    (getIssueListsFromTracker as jest.Mock).mockResolvedValueOnce([
      {
        issueNumber: '7',
        title: 'this is my first updated issue',
        owner: 'upstreamOwner',
        repo: 'selectedRepos',
      },
    ]);

    (executeSteps as jest.Mock).mockResolvedValueOnce({
      succeeded: true,
      stepResults: [],
    });

    await issue(mockContext);

    expect(mockContext.adapter.updateIssue).toHaveBeenCalled();
  });
  it('update issue if the issue exists in tracker', async () => {
    (getIssueListsFromTracker as jest.Mock).mockResolvedValueOnce([
      {
        title: 'this is my first new updated issue',
        owner: 'upstreamOwner',
        repo: 'selectedRepos',
      },
    ]);

    (executeSteps as jest.Mock).mockResolvedValueOnce({
      succeeded: true,
      stepResults: [],
    });

    (mockContext.adapter.createIssue as jest.Mock).mockResolvedValueOnce('7');
    await issue(mockContext);
    expect(mockLogger.spinner).toHaveBeenCalled();
    expect(mockContext.adapter.createIssue).toHaveBeenCalled();
  });
  it('should catch error when issue tracker is accessed', async () => {
    (getIssueListsFromTracker as jest.Mock).mockRejectedValueOnce([]);
    await issue(mockContext);
    expect(mockLogger.error).toHaveBeenCalledWith('Error to post/update issue');
  });

  it('should catch error when issue command is accessed', async () => {
    await issue(mockContext1);
    expect(mockSpinner.fail).toHaveBeenCalledWith('No issues in the shepherd yml to post');
  });
  it('should catch error when issue with no title command is accessed', async () => {
    await issue(mockContext2);
    expect(mockSpinner.fail).toHaveBeenCalledWith('No issues in the shepherd yml to post');
  });
  it('should catch error when issue with no title command is accessed', async () => {
    (getIssueListsFromTracker as jest.Mock).mockResolvedValueOnce([
      {
        issueNumber: '7',
        title: 'this is my first updated issue',
        owner: 'newowner',
        status: 'open',
        repo: 'newrepo',
      },
      {
        issueNumber: '0',
        title: 'this is my first updated issue',
        owner: 'newowner4',
        status: 'open',
        repo: 'newrepo4',
      },
    ]);

    (executeSteps as jest.Mock).mockResolvedValueOnce({
      succeeded: true,
      stepResults: [],
    });
    await issue(mockContext3);
    expect(mockContext3.adapter.createIssue).toHaveBeenCalled();
  });
});

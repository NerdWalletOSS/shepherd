import issue from './issue';
import { IMigrationContext } from '../migration-context';
import mockAdapter from '../adapters/adapter.mock';
import mockLogger from '../logger/logger.mock';
import { getIssueListsFromTracker } from '../util/persisted-data';

jest.mock('../util/persisted-data');

describe('issue command', () => {
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
                        labels: ['bug']
                    }
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

    it('create issue if the issue doesnt exists in tracker',
        async () => {
            (getIssueListsFromTracker as jest.Mock).mockResolvedValueOnce(
                [{
                    issueNumber: '7',
                    title: 'this is my first updated issue',
                    owner: 'newowner',
                    repo: 'newrepo'
                }]
            );

            await issue(mockContext);

            expect(mockContext.adapter.createIssue).toHaveBeenCalled();
     });

    it('update issue if the issue exists in tracker',
        async () => {
            (getIssueListsFromTracker as jest.Mock).mockResolvedValueOnce(
                [{
                    issueNumber: '7',
                    title: 'this is my first updated issue',
                    owner: 'upstreamOwner',
                    repo: 'selectedRepos'
                }]
            );

            await issue(mockContext);

            expect(mockContext.adapter.updateIssue).toHaveBeenCalled();
        });

    it('should catch error when issue tracker is accessed', async () => {
        (getIssueListsFromTracker as jest.Mock).mockRejectedValueOnce([]);
        await issue(mockContext);
        expect(mockLogger.error).toHaveBeenCalledWith("Error to post/update issue");
    });

});

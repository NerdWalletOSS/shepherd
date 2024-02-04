import listIssues from './list-issues';
import { IMigrationContext } from '../migration-context';
import mockAdapter from '../adapters/adapter.mock';
import mockLogger from '../logger/logger.mock';
import { getIssueTrackerFile } from '../util/persisted-data';

jest.mock('fs-extra', () => {
    return {
        // Mock other methods as needed
        readFile: jest.fn().mockResolvedValue('{"name": "test"}'),
    };
});

jest.mock('../util/persisted-data');

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

    it('should list issues when the command is invoked',
        async () => {

            (getIssueTrackerFile as jest.Mock).mockResolvedValueOnce(
                [{
                    issueNumber: '7',
                    title: 'this is my first updated issue',
                    owner: 'newOwner',
                    repo: 'newRepo'
                }]
            );

            await listIssues(mockContext);

            expect(process.stdout.write).toEqual(expect.any(Function))
        });

});

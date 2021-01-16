import GithubService from './github'

const githubService = new GithubService();

(async () => {
    await githubService.getActiveReposForOrgGQL({ 
        org: 'pagerinc',
    });    
})();

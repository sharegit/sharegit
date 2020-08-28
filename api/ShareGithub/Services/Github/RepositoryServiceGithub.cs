using Core.Model;
using Core.Model.Github;
using Microsoft.Extensions.Options;
using ShareGithub.GithubAuth;
using ShareGithub.Services;
using ShareGithub.Settings;
using System.Collections.Generic;
using System.Net.Http;
using System.Threading.Tasks;

namespace ShareGithub
{
    public class RepositoryServiceGithub : GithubBaseService, IRepositoryServiceGithub
    {
        public RepositoryServiceGithub(IOptions<GithubAppSettings> appSettings) : base(appSettings)
        {
        }

        /// <summary>
        /// https://docs.github.com/en/rest/reference/apps#list-repositories-accessible-to-the-app-installation
        /// </summary>
        public async Task<APIResponse<GithubRepositories>> GetInstallationRepositories(GithubAppAccess installationAccess)
        {
            return await FetchAPI<GithubRepositories>(
                $"/installation/repositories",
                HttpMethod.Get,
                new InstallationGithubAuth(installationAccess));
        }

        /// <summary>
        /// https://docs.github.com/en/rest/reference/repos#get-a-repository
        /// </summary>
        public async Task<APIResponse<GithubRepository>> GetInstallationRepository(string owner, string repo, GithubAppAccess installationAccess)
        {
            return await FetchAPI<GithubRepository>(
                $"/repos/{owner}/{repo}",
                HttpMethod.Get,
                new InstallationGithubAuth(installationAccess));
        }

        /// <summary>
        /// https://docs.github.com/en/rest/reference/git#get-a-tree
        /// </summary>
        public async Task<APIResponse<GithubTree>> GetRepositoryTree(string owner, string repo, string sha, GithubAppAccess installationAccess, bool recursive)
        {
            return await FetchAPI<GithubTree>(
                $"/repos/{owner}/{repo}/git/trees/{sha}",
                HttpMethod.Get,
                new InstallationGithubAuth(installationAccess),
                ("recursive", recursive ? "true" : "false"));
        }

        /// <summary>
        /// https://docs.github.com/en/rest/reference/repos#list-branches
        /// </summary>
        public async Task<APIResponse<GithubBranch[]>> GetBranches(string owner, string repo, GithubAppAccess installationAccess)
        {
            return await FetchAPI<GithubBranch[]>(
                $"/repos/{owner}/{repo}/branches",
                HttpMethod.Get,
                new InstallationGithubAuth(installationAccess));
        }
        /// <summary>
        /// https://docs.github.com/en/rest/reference/repos#list-branches
        /// </summary>
        public async Task<APIResponse<GithubBranch[]>> GetBranches(string owner, string repo, GithubUserAccess userAccess)
        {
            return await FetchAPI<GithubBranch[]>(
                $"/repos/{owner}/{repo}/branches",
                HttpMethod.Get,
                new UserGithubAuth(userAccess));
        }

        /// <summary>
        /// https://docs.github.com/en/rest/reference/repos#list-commits
        /// </summary>
        public async Task<APIResponse<GithubCommit[]>> GetCommits(string owner, string repo, string sha, string uri, GithubAppAccess installationAccess, int page = 0, int per_page = 0)
        {
            return await FetchAPI<GithubCommit[]>(
                $"/repos/{owner}/{repo}/commits",
                HttpMethod.Get,
                new InstallationGithubAuth(installationAccess),
                ("sha", sha),
                ("path", uri),
                ("page", page.ToString()),
                ("per_page", per_page.ToString()));
        }

        /// <summary>
        /// https://docs.github.com/en/rest/reference/repos#list-commits
        /// </summary>
        public async Task<APIResponse<GithubCommit[]>> GetCommits(string owner, string repo, string sha, string uri, GithubUserAccess installationAccess, int page = 0, int per_page = 0)
        {
            return await FetchAPI<GithubCommit[]>(
                $"/repos/{owner}/{repo}/commits",
                HttpMethod.Get,
                new UserGithubAuth(installationAccess),
                ("sha", sha),
                ("path", uri),
                ("page", page.ToString()),
                ("per_page", per_page.ToString()));
        }

        /// <summary>
        /// https://docs.github.com/en/rest/reference/repos#get-repository-content
        /// </summary>
        public async Task<APIResponse<GithubContent>> GetContent(string owner, string repo, string sha, string uri, GithubAppAccess installationAccess)
        {
            return await FetchAPI<GithubContent>(
                $"/repos/{owner}/{repo}/contents/{uri}",
                HttpMethod.Get,
                new InstallationGithubAuth(installationAccess),
                ("ref", sha));
        }
        /// <summary>
        /// https://docs.github.com/en/rest/reference/repos#get-repository-content
        /// </summary>
        public async Task<APIResponse<GithubContent[]>> GetDirectoryContent(string owner, string repo, string sha, string uri, GithubAppAccess installationAccess)
        {
            return await FetchAPI<GithubContent[]>(
                $"/repos/{owner}/{repo}/contents/{uri}",
                HttpMethod.Get,
                new InstallationGithubAuth(installationAccess),
                ("ref", sha));
        }

        public async Task<GithubRepository[]> GetUserInstallationRepositories(GithubUserAccess userAccessToken)
        {
            var installations = await GetUserInstallations(userAccessToken);

            var repos = new List<GithubRepository>();
            foreach (var installation in installations.Value.Installations)
            {
                var installationAccess = await GetAccess(installation.Id);
                var installationRepositories = await GetInstallationRepositories(installationAccess);

                foreach (var repo in installationRepositories.Value.Repositories)
                {
                    repos.Add(repo);
                }
            }
            return repos.ToArray();
        }


    }
}

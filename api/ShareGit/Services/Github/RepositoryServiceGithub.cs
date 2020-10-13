using Core.Model;
using Core.Model.Github;
using Microsoft.Extensions.Options;
using ShareGit.GithubAuth;
using ShareGit.Services;
using ShareGit.Settings;
using System.Collections.Generic;
using System.Net.Http;
using System.Threading.Tasks;
using System.Web;

namespace ShareGit
{
    public class RepositoryServiceGithub : GithubBaseService, IRepositoryServiceGithub
    {
        public RepositoryServiceGithub(IOptions<GithubAppSettings> appSettings) : base(appSettings)
        {
        }

        /// <summary>
        /// https://docs.github.com/en/rest/reference/apps#list-repositories-accessible-to-the-user-access-token
        /// </summary>
        public async Task<APIResponse<GithubRepositories>> GetRepositoriesAccessibleToUserInstallation(int installationId, GithubUserAccess userAccess)
        {
            return await FetchAPI<GithubRepositories>(
                $"/user/installations/{installationId}/repositories",
                HttpMethod.Get,
                new UserGithubAuth(userAccess));
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
        /// https://docs.github.com/en/rest/reference/repos#get-repository-content
        /// </summary>
        public async Task<APIResponse<GithubContent>> GetContent(string owner, string repo, string sha, string uri, GithubAppAccess installationAccess)
        {
            return await FetchAPI<GithubContent>(
                $"/repos/{owner}/{repo}/contents/{HttpUtility.UrlEncode(uri)?.Replace("+", "%20")}",
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
                $"/repos/{owner}/{repo}/contents/{HttpUtility.UrlEncode(uri)?.Replace("+", "%20")}",
                HttpMethod.Get,
                new InstallationGithubAuth(installationAccess),
                ("ref", sha));
        }

        /// <summary>
        /// https://docs.github.com/en/rest/reference/repos#download-a-repository-archive
        /// </summary>
        public async Task<APIResponse<string>> GetDownloadURL(string owner, string repo, string sha, GithubAppAccess installationAccess)
        {
            return await FetchAPI<string>(
                $"/repos/{owner}/{repo}/zipball/{sha}", 
                HttpMethod.Get,
                new InstallationGithubAuth(installationAccess));
        }

        /// <summary>
        /// https://docs.github.com/en/rest/reference/apps#delete-an-installation-for-the-authenticated-app
        /// </summary>
        public async Task RemoveUserInstalation(int installationId)
        {
            await FetchAPI<object>(
                $"/app/installations/{installationId}",
                HttpMethod.Delete,
                new AppGithubAuth());
        }

        public async Task<GithubRepository[]> GetUserInstallationRepositories(GithubUserAccess userAccessToken)
        {
            var installations = await GetUserInstallations(userAccessToken);

            var repos = new List<GithubRepository>();
            foreach (var installation in installations.Value.Installations)
            {
                var installationRepositories = await GetRepositoriesAccessibleToUserInstallation(installation.Id, userAccessToken);

                foreach (var repo in installationRepositories.Value.Repositories)
                {
                    // Only list repos where this user has push permission!
                    if(repo.Permissions.Push)
                        repos.Add(repo);
                }
            }
            return repos.ToArray();
        }

    }
}

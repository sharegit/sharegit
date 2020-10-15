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
        /// Paginated response
        /// </summary>
        public async Task<APIResponse<PaginatedGithubResponse<GithubRepository>>> GetRepositoriesAccessibleToUserInstallation(int installationId, GithubUserAccess userAccess)
        {
            return await FetchGithubAPIRecursively<GithubRepositories, GithubRepository>(
                $"/user/installations/{installationId}/repositories",
                HttpMethod.Get,
                new UserGithubAuth(userAccess));
        }

        /// <summary>
        /// https://docs.github.com/en/rest/reference/apps#list-repositories-accessible-to-the-app-installation
        /// </summary>
        public async Task<APIResponse<PaginatedGithubResponse<GithubRepository>>> GetInstallationRepositories(GithubAppAccess installationAccess)
        {
            return await FetchGithubAPIRecursively<GithubRepositories, GithubRepository>(
                $"/installation/repositories",
                HttpMethod.Get,
                new InstallationGithubAuth(installationAccess));
        }

        /// <summary>
        /// https://docs.github.com/en/rest/reference/repos#list-branches
        /// </summary>
        public async Task<APIResponse<GithubBranch[]>> GetBranches(string owner, string repo, GithubUserAccess userAccess)
        {
            // TODO: It should be paginated but the response does not contain a total_count, so ¯\_(ツ)_/¯
            return await FetchAPI<GithubBranch[]>(
                $"/repos/{owner}/{repo}/branches",
                HttpMethod.Get,
                new UserGithubAuth(userAccess));
        }

        /// <summary>
        /// https://docs.github.com/en/rest/reference/repos#get-repository-content
        /// This API has an upper limit of 1,000 files for a directory. If you need to retrieve more files, use the Git Trees API.
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
        /// This API has an upper limit of 1,000 files for a directory. If you need to retrieve more files, use the Git Trees API.
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
            foreach (var installation in installations.Value.Values)
            {
                var installationRepositories = await GetRepositoriesAccessibleToUserInstallation(installation.Id, userAccessToken);

                foreach (var repo in installationRepositories.Value.Values)
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

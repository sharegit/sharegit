using Core.Model.Github;
using Newtonsoft.Json.Linq;
using ShareGithub.GithubAuth;
using ShareGithub.Services;
using System.Collections.Generic;
using System.Net.Http;
using System.Threading.Tasks;

namespace ShareGithub
{
    public class RepositoryService : GithubBaseService, IRepositoryService
    {
        /// <summary>
        /// https://docs.github.com/en/rest/reference/apps#list-repositories-accessible-to-the-app-installation
        /// </summary>
        public async Task<GithubAPIResponse<GithubRepositories>> GetInstallationRepositories(GithubAppAccess installationAccess)
        {
            return await FetchGithubAPI<GithubRepositories>(
                $"/installation/repositories",
                HttpMethod.Get,
                new InstallationGithubAuth(installationAccess));
        }

        /// <summary>
        /// https://docs.github.com/en/rest/reference/repos#get-a-repository
        /// </summary>
        public async Task<GithubAPIResponse<GithubRepository>> GetInstallationRepository(string owner, string repo, GithubAppAccess installationAccess)
        {
            return await FetchGithubAPI<GithubRepository>(
                $"/repos/{owner}/{repo}",
                HttpMethod.Get,
                new InstallationGithubAuth(installationAccess));
        }

        /// <summary>
        /// https://docs.github.com/en/rest/reference/git#get-a-tree
        /// </summary>
        public async Task<GithubAPIResponse<GithubTree>> GetRepositoryTree(string owner, string repo, string sha, GithubAppAccess installationAccess, bool recursive)
        {
            return await FetchGithubAPI<GithubTree>(
                $"/repos/{owner}/{repo}/git/trees/{sha}",
                HttpMethod.Get,
                new InstallationGithubAuth(installationAccess),
                ("recursive", recursive ? "true" : "false"));
        }

        /// <summary>
        /// https://docs.github.com/en/rest/reference/repos#list-branches
        /// </summary>
        public async Task<GithubAPIResponse<GithubBranch[]>> GetBranches(string owner, string repo, GithubAppAccess installationAccess)
        {
            return await FetchGithubAPI<GithubBranch[]>(
                $"/repos/{owner}/{repo}/branches",
                HttpMethod.Get,
                new InstallationGithubAuth(installationAccess));
        }

        /// <summary>
        /// https://docs.github.com/en/rest/reference/repos#list-commits
        /// </summary>
        public async Task<GithubAPIResponse<GithubCommit[]>> GetCommits(string owner, string repo, string sha, string uri, GithubAppAccess installationAccess, int page = 0, int per_page = 0)
        {
            return await FetchGithubAPI<GithubCommit[]>(
                $"/repos/{owner}/{repo}/commits",
                HttpMethod.Get,
                new InstallationGithubAuth(installationAccess),
                ("sha", sha),
                ("path", uri),
                ("page", page.ToString()),
                ("per_page", per_page.ToString()));
        }

        /// <summary>
        /// https://docs.github.com/en/rest/reference/repos#get-repository-content
        /// </summary>
        public async Task<GithubAPIResponse<GithubContent>> GetContent(string owner, string repo, string sha, string uri, GithubAppAccess installationAccess)
        {
            return await FetchGithubAPI<GithubContent>(
                $"/repos/{owner}/{repo}/contents/{uri}",
                HttpMethod.Get,
                new InstallationGithubAuth(installationAccess),
                ("ref", sha));
        }

        public async Task<IEnumerable<GithubRepo>> GetUserInstallationRepositories(GithubUserAccess userAccessToken)
        {
            var installationsReponse = await GetUserInstallations(userAccessToken);
            dynamic installations = JObject.Parse(installationsReponse.RAW);
            var ids = new List<int>();
            foreach (var installation in installations.installations)
            {
                int id = installation.id;
                ids.Add(id);
            }

            var repos = new List<GithubRepo>();
            foreach (var id in ids)
            {
                var installationAccess = await GetAccess(id);
                var installationRepositoriesResponse = await GetInstallationRepositories(installationAccess);
                dynamic installationRepositories = JObject.Parse(installationRepositoriesResponse.RAW);

                foreach (var repo in installationRepositories.repositories)
                {
                    string name = repo.name;
                    string owner = repo.owner.login;
                    string description = repo.description;

                    repos.Add(new GithubRepo()
                    {
                        Repo = name,
                        Owner = owner,
                        Description = description
                    });
                }
            }
            return repos;
        }


    }
}

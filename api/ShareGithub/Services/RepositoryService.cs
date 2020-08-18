using Core.Model;
using Core.Model.Github;
using Jose;
using Newtonsoft.Json.Linq;
using Org.BouncyCastle.Crypto;
using Org.BouncyCastle.Crypto.Parameters;
using Org.BouncyCastle.OpenSsl;
using ShareGithub.GithubAuth;
using ShareGithub.Services;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Security.Cryptography;
using System.Threading.Tasks;
using System.Web;

namespace ShareGithub
{
    public class RepositoryService : GithubBaseService, IRepositoryService
    {
        public async Task<GithubAPIResponse> GetInstallation(string user)
        {
            return await FetchGithubAPI($"https://api.github.com/users/{user}/installation", HttpMethod.Get, new AppGithubAuth());
        }
        public async Task<GithubAPIResponse> GetAccessToken(string url)
        {
            return await FetchGithubAPI(url, HttpMethod.Post, new AppGithubAuth());
        }
        public async Task<GithubAPIResponse> GetInstallationRepositories(GithubAppAccess installationAccess)
        {
            return await FetchGithubAPI("https://api.github.com/installation/repositories", HttpMethod.Get, new InstallationGithubAuth(installationAccess));
        }
        public async Task<GithubAPIResponse> GetInstallationRepository(string owner, string repo, GithubAppAccess installationAccess)
        {
            return await FetchGithubAPI($"https://api.github.com/repos/{owner}/{repo}", HttpMethod.Get, new InstallationGithubAuth(installationAccess));
        }
        public async Task<GithubAPIResponse> GetRepositoryTree(string trees_url, GithubAppAccess installationAccess, bool recursive)
        {
            
            return await FetchGithubAPI(trees_url, HttpMethod.Get, new InstallationGithubAuth(installationAccess), ("recursive", recursive ? "true" : "false"));
        }
        public async Task<GithubAPIResponse> GetBranches(string owner, string repo, GithubAppAccess installationAccess)
        {
            return await FetchGithubAPI($"https://api.github.com/repos/{owner}/{repo}/branches", HttpMethod.Get, new InstallationGithubAuth(installationAccess));
        }
        public async Task<GithubAPIResponse> GetCommits(string owner, string repo, string sha, string uri, GithubAppAccess installationAccess, int page = 0, int per_page = 0)
        {
            return await FetchGithubAPI($"https://api.github.com/repos/{owner}/{repo}/commits",
            HttpMethod.Get,
            new InstallationGithubAuth(installationAccess),
            ("sha", sha),
            ("path", uri),
            ("page", page.ToString()),
            ("per_page", per_page.ToString()));
        }
        public async Task<GithubAPIResponse> GetContent(string owner, string repo, string sha, string uri, GithubAppAccess installationAccess)
        {
            return await FetchGithubAPI($"https://api.github.com/repos/{owner}/{repo}/contents/{uri}",
                HttpMethod.Get,
                new InstallationGithubAuth(installationAccess),
                ("ref", sha));
        }
        public async Task<GithubAPIResponse> GetUserInstallations(GithubUserAccess userAccessToken)
        {
            return await FetchGithubAPI($"https://api.github.com/user/installations",
                HttpMethod.Get,
                new UserGithubAuth(userAccessToken));
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
            foreach(var id in ids)
            {
                var installationAccess = await GetAccess(id);
                var installationRepositoriesResponse = await GetInstallationRepositories(installationAccess);
                dynamic installationRepositories = JObject.Parse(installationRepositoriesResponse.RAW);

                foreach(var repo in installationRepositories.repositories)
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

        public async Task<GithubAppAccess> GetAccess(string user)
        {
            var installationResponse = await GetInstallation(user);
            dynamic installation = Newtonsoft.Json.Linq.JObject.Parse(installationResponse.RAW);
            string accessTokensUrl = installation.access_tokens_url;
            int installationid = installation.id;

            var accessTokensResponse = await GetAccessToken(accessTokensUrl);
            dynamic accessTokens = Newtonsoft.Json.Linq.JObject.Parse(accessTokensResponse.RAW);
            string accessToken = accessTokens.token;

            return new GithubAppAccess()
            {
                InstallationId = installationid,
                AccessToken = accessToken
            };
        }
        public async Task<GithubAppAccess> GetAccess(int installationId)
        {
            var accessTokensResponse = await GetAccessToken($"https://api.github.com/app/installations/{installationId}/access_tokens");
            dynamic accessTokens = JObject.Parse(accessTokensResponse.RAW);
            string accessToken = accessTokens.token;

            return new GithubAppAccess()
            {
                InstallationId = installationId,
                AccessToken = accessToken
            };
        }

    }
}

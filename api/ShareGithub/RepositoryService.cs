using Jose;
using Org.BouncyCastle.Crypto;
using Org.BouncyCastle.Crypto.Parameters;
using Org.BouncyCastle.OpenSsl;
using ShareGithub.GithubAuth;
using System;
using System.Net.Http;
using System.Security.Cryptography;
using System.Threading.Tasks;
using System.Web;

namespace ShareGithub
{
    public class RepositoryService : IRepositoryService
    {
        public async Task<string> GetInstallation(string user)
        {
            return await FetchGithubAPI($"https://api.github.com/users/{user}/installation", HttpMethod.Get, new AppGithubAuth());
        }
        public async Task<string> GetAccessToken(string url)
        {
            return await FetchGithubAPI(url, HttpMethod.Post, new AppGithubAuth());
        }
        public async Task<string> GetInstallationRepositories(string url, string installationAccess)
        {
            return await FetchGithubAPI(url, HttpMethod.Get, new InstallationGithubAuth(installationAccess));
        }
        public async Task<string> GetInstallationRepository(string owner, string repo, string installationAccess)
        {
            return await FetchGithubAPI($"https://api.github.com/repos/{owner}/{repo}", HttpMethod.Get, new InstallationGithubAuth(installationAccess));
        }
        public async Task<string> GetRepositoryTree(string trees_url, string installationAccess, bool recursive)
        {
            
            return await FetchGithubAPI(trees_url, HttpMethod.Get, new InstallationGithubAuth(installationAccess), ("recursive", recursive ? "true" : "false"));
        }
        public async Task<string> GetBranches(string owner, string repo, string installationAccess)
        {
            return await FetchGithubAPI($"https://api.github.com/repos/{owner}/{repo}/branches", HttpMethod.Get, new InstallationGithubAuth(installationAccess));
        }

        private async Task<string> FetchGithubAPI(string url, HttpMethod method, GithubAuthMode authMode, params (string key, string value)[] queryOptions)
        {
            string rawresponse;
            using (var httpClient = new HttpClient())
            {
                var uriBuilder = new UriBuilder(url);
                var query = HttpUtility.ParseQueryString(uriBuilder.Query);
                foreach(var queryOption in queryOptions)
                {
                    query[queryOption.key] = queryOption.value;
                }
                uriBuilder.Query = query.ToString();
                var request = new HttpRequestMessage()
                {
                    RequestUri = new Uri(uriBuilder.ToString()),
                    Method = method,
                };
                request.Headers.Add("user-agent", "asp.net-core.3.1");

                authMode.AddAuthHeader(request.Headers);

                request.Headers.Add("Accept", "application/vnd.github.machine-man-preview+json");
                using (var response = await httpClient.SendAsync(request))
                {
                    rawresponse = await response.Content.ReadAsStringAsync();
                }
            }

            return rawresponse;
        }

    }
}

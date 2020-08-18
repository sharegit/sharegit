using Core.Model.Github;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using Newtonsoft.Json.Serialization;
using ShareGithub.GithubAuth;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Threading.Tasks;
using System.Web;

namespace ShareGithub.Services
{
    public abstract class GithubBaseService
    {
        private const string GITHUB_API = "https://api.github.com";
        private const string GITHUB = "https://github.com";

        /// <summary>
        /// https://docs.github.com/en/rest/reference/apps#get-a-user-installation-for-the-authenticated-app
        /// </summary>
        public async Task<GithubAPIResponse<GithubUserInstallation>> GetInstallation(string user)
        {
            return await FetchGithubAPI<GithubUserInstallation>(
                $"/users/{user}/installation",
                HttpMethod.Get,
                new AppGithubAuth());
        }
        /// <summary>
        /// https://docs.github.com/en/rest/reference/apps#create-an-installation-access-token-for-an-app
        /// </summary>
        public async Task<GithubAPIResponse<GithubInstallationAccessRequest>> GetAccessToken(int installationId)
        {
            return await FetchGithubAPI<GithubInstallationAccessRequest>(
                $"/app/installations/{installationId}/access_tokens",
                HttpMethod.Post,
                new AppGithubAuth());
        }
        /// <summary>
        /// https://docs.github.com/en/rest/reference/apps#list-app-installations-accessible-to-the-user-access-token
        /// </summary>
        public async Task<GithubAPIResponse<GithubUserInstallations>> GetUserInstallations(GithubUserAccess userAccessToken)
        {
            return await FetchGithubAPI<GithubUserInstallations>(
                $"/user/installations",
                HttpMethod.Get,
                new UserGithubAuth(userAccessToken));
        }

        public async Task<GithubAppAccess> GetAccess(string user)
        {
            var installation = await GetInstallation(user);
            return await GetAccess(installation.Value.Id);
        }
        public async Task<GithubAppAccess> GetAccess(int installationId)
        {
            var accessToken = await GetAccessToken(installationId);

            return new GithubAppAccess()
            {
                InstallationId = installationId,
                AccessToken = accessToken.Value.Token
            };
        }

        protected async Task<GithubAPIResponse<T>> FetchGithubAPI<T>(string url, HttpMethod method, GithubAuthMode authMode = null, params (string key, string value)[] queryOptions)
        {
            return await Fetch<T>($"{GITHUB_API}{url}", method, authMode, queryOptions);
        }
        protected async Task<GithubAPIResponse<T>> FetchGithub<T>(string url, HttpMethod method, GithubAuthMode authMode = null, params (string key, string value)[] queryOptions)
        {
            return await Fetch<T>($"{GITHUB}{url}", method, authMode, queryOptions);
        }
        protected async Task<GithubAPIResponse<T>> Fetch<T>(string fullUrl, HttpMethod method, GithubAuthMode authMode = null, params (string key, string value)[] queryOptions)
        {
            GithubAPIResponse<T> githubAPIResponse = new GithubAPIResponse<T>();
            using (var httpClient = new HttpClient())
            {
                var uriBuilder = new UriBuilder($"{fullUrl}");
                var query = HttpUtility.ParseQueryString(uriBuilder.Query);
                foreach (var queryOption in queryOptions)
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

                authMode?.AddAuthHeader(request.Headers);

                request.Headers.Add("Accept", new string[] {
                    "application/vnd.github.machine-man-preview+json",
                    "application/vnd.github.v3+json",
                    "application/json"
                });
                using (var response = await httpClient.SendAsync(request))
                {
                    var d = new Dictionary<string, string>();
                    foreach (var header in response.Headers.AsEnumerable())
                    {
                        d.Add(header.Key, string.Join(',', header.Value));
                    }
                    githubAPIResponse.RAW = await response.Content.ReadAsStringAsync();


                    DefaultContractResolver contractResolver = new DefaultContractResolver
                    {
                        NamingStrategy = new SnakeCaseNamingStrategy()
                    };

                    githubAPIResponse.Value = JsonConvert.DeserializeObject<T>(githubAPIResponse.RAW, new JsonSerializerSettings
                    {
                        ContractResolver = contractResolver,
                        Formatting = Formatting.Indented
                    });

                    if (d.TryGetValue("X-RateLimit-Remaining", out string rateLimitStr))
                    {
                        githubAPIResponse.RemainingLimit = int.Parse(rateLimitStr);
                    }
                }
            }

            return githubAPIResponse;
        }
    }
}

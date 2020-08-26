using Core.Model.Github;
using Core.Model.GitLab;
using Newtonsoft.Json;
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
    public abstract class GitlabBaseService
    {
        private const string GITLAB_API = "https://gitlab.com/api/v4";
        private const string GITLAB = "https://gitlab.com";

        protected async Task<GitlabAPIResponse<T>> FetchGitlabAPI<T>(string url, HttpMethod method, AuthMode authMode = null, params (string key, string value)[] queryOptions)
        {
            return await Fetch<T>($"{GITLAB_API}{url}", method, authMode, queryOptions);
        }
        protected async Task<GitlabAPIResponse<T>> FetchGitlab<T>(string url, HttpMethod method, AuthMode authMode = null, params (string key, string value)[] queryOptions)
        {
            return await Fetch<T>($"{GITLAB}{url}", method, authMode, queryOptions);
        }
        protected async Task<GitlabAPIResponse<T>> Fetch<T>(string fullUrl, HttpMethod method, AuthMode authMode = null, params (string key, string value)[] queryOptions)
        {
            GitlabAPIResponse<T> gitLabAPIResponse = new GitlabAPIResponse<T>();
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
                    "application/json"
                });
                using (var response = await httpClient.SendAsync(request))
                {
                    var d = new Dictionary<string, string>();
                    foreach (var header in response.Headers.AsEnumerable())
                    {
                        d.Add(header.Key, string.Join(',', header.Value));
                    }
                    gitLabAPIResponse.RAW = await response.Content.ReadAsStringAsync();


                    DefaultContractResolver contractResolver = new DefaultContractResolver
                    {
                        NamingStrategy = new SnakeCaseNamingStrategy()
                    };

                    gitLabAPIResponse.Value = JsonConvert.DeserializeObject<T>(gitLabAPIResponse.RAW, new JsonSerializerSettings
                    {
                        ContractResolver = contractResolver,
                        Formatting = Formatting.Indented
                    });

                    if (d.TryGetValue("X-RateLimit-Remaining", out string rateLimitStr))
                    {
                        gitLabAPIResponse.RemainingLimit = int.Parse(rateLimitStr);
                    }
                }
            }

            return gitLabAPIResponse;
        }
    }
}

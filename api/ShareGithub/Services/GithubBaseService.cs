using Core.Model;
using ShareGithub.GithubAuth;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;
using System.Web;

namespace ShareGithub.Services
{
    public abstract class GithubBaseService
    {
        protected async Task<GithubAPIResponse> FetchGithubAPI(string url, HttpMethod method, GithubAuthMode authMode = null, params (string key, string value)[] queryOptions)
        {
            GithubAPIResponse githubAPIResponse = new GithubAPIResponse();
            using (var httpClient = new HttpClient())
            {
                var uriBuilder = new UriBuilder(url);
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

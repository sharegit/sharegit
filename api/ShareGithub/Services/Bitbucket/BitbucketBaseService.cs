using Core.Model.Bitbucket;
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
    public abstract class BitbucketBaseService
    {
        private const string BITBUCKET_API = "https://api.bitbucket.org/2.0";
        private const string BITBUCKET = "https://bitbucket.org/site";

        protected async Task<BitbucketAPIResponse<T>> FetchBitbucketAPI<T>(string url, HttpMethod method, AuthMode authMode = null, Dictionary<string, string> body = null, params (string key, string value)[] queryOptions)
        {
            return await Fetch<T>($"{BITBUCKET_API}{url}", method, authMode, body, queryOptions);
        }
        protected async Task<BitbucketAPIResponse<T>> FetchBitbucket<T>(string url, HttpMethod method, AuthMode authMode = null, Dictionary<string, string> body = null, params (string key, string value)[] queryOptions)
        {
            return await Fetch<T>($"{BITBUCKET}{url}", method, authMode, body, queryOptions);
        }
        protected async Task<BitbucketAPIResponse<T>> Fetch<T>(string fullUrl, HttpMethod method, AuthMode authMode = null, Dictionary<string, string> body = null, params (string key, string value)[] queryOptions)
        {
            BitbucketAPIResponse<T> bitbucketAPIResponse = new BitbucketAPIResponse<T>();
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

                request.Headers.Add("ContentType", "application/x-www-form-urlencoded");

                if (body != null)
                {
                    request.Content = new FormUrlEncodedContent(body);
                }

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
                    bitbucketAPIResponse.RAW = await response.Content.ReadAsStringAsync();


                    DefaultContractResolver contractResolver = new DefaultContractResolver
                    {
                        NamingStrategy = new SnakeCaseNamingStrategy()
                    };

                    bitbucketAPIResponse.Value = JsonConvert.DeserializeObject<T>(bitbucketAPIResponse.RAW, new JsonSerializerSettings
                    {
                        ContractResolver = contractResolver,
                        Formatting = Formatting.Indented
                    });

                    if (d.TryGetValue("X-RateLimit-Remaining", out string rateLimitStr))
                    {
                        bitbucketAPIResponse.RemainingLimit = int.Parse(rateLimitStr);
                    }
                }
            }

            return bitbucketAPIResponse;
        }
    }
}

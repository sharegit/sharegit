using Core.Model.Bitbucket;
using Newtonsoft.Json;
using Newtonsoft.Json.Serialization;
using Org.BouncyCastle.Math.EC.Rfc7748;
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


        protected async Task<BitbucketAPIResponse<PaginatedBitbucketResponse<T>>> FetchBitbucketAPIRecursively<T>(string url, HttpMethod method, AuthMode authMode = null, Dictionary<string, string> body = null, params (string key, string value)[] queryOptions)
        {
            List<T> values = new List<T>();
            BitbucketAPIResponse<PaginatedBitbucketResponse<T>> currentResponse = null;
            do
            {
                currentResponse = currentResponse switch
                {
                    null => await Fetch<PaginatedBitbucketResponse<T>>($"{BITBUCKET_API}{url}", method, authMode, body, queryOptions),
                    _ => currentResponse.Value.Next switch
                    {
                        null => null,
                        _ => await Fetch<PaginatedBitbucketResponse<T>>($"{currentResponse.Value.Next}", method, authMode, body, queryOptions)
                    }
                };
                if (currentResponse?.Value?.Values != null)
                    values.AddRange(currentResponse.Value.Values);
            } while (currentResponse != null);
            return new BitbucketAPIResponse<PaginatedBitbucketResponse<T>>()
            {
                RAW = "",
                RemainingLimit = 0,
                Value = new PaginatedBitbucketResponse<T>()
                {
                    Next = null,
                    PageLen = 0,
                    Values = values.ToArray()
                }
            };
        }
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

                    try
                    {
                        bitbucketAPIResponse.Value = JsonConvert.DeserializeObject<T>(bitbucketAPIResponse.RAW, new JsonSerializerSettings
                        {
                            ContractResolver = contractResolver,
                            Formatting = Formatting.Indented
                        });
                    }
                    catch
                    {
                    }

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

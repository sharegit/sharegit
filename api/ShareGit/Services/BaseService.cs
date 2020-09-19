using Core.Exceptions;
using Core.Model;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;
using Newtonsoft.Json.Serialization;
using ShareGit.GithubAuth;
using ShareGit.Settings;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Threading.Tasks;
using System.Web;

namespace ShareGit.Services
{
    public abstract class BaseService<TAppSetting>
        where TAppSetting : class, IAppSettings, new()
    {
        protected TAppSetting AppSettings { get; }
        public BaseService(IOptions<TAppSetting> appSettings)
        {
            AppSettings = appSettings.Value;
        }


        public async Task<APIResponse<T>> FetchSite<T>(string url, HttpMethod method, params (string key, string value)[] queryOptions) =>
            await Fetch<T>($"{AppSettings.SiteEndpoint}{url}", method, null, null, queryOptions);

        public async Task<APIResponse<T>> FetchSite<T>(string url, HttpMethod method, AuthMode authMode, params (string key, string value)[] queryOptions) =>
            await Fetch<T>($"{AppSettings.SiteEndpoint}{url}", method, authMode, null, queryOptions);

        public async Task<APIResponse<T>> FetchSite<T>(string url, HttpMethod method, Dictionary<string, string> body, params (string key, string value)[] queryOptions) =>
            await Fetch<T>($"{AppSettings.SiteEndpoint}{url}", method, null, body, queryOptions);

        public async Task<APIResponse<T>> FetchSite<T>(string url, HttpMethod method, AuthMode authMode, Dictionary<string, string> body, params (string key, string value)[] queryOptions) =>
            await Fetch<T>($"{AppSettings.SiteEndpoint}{url}", method, authMode, body, queryOptions);


        public async Task<APIResponse<T>> FetchAPI<T>(string url, HttpMethod method, params (string key, string value)[] queryOptions) =>
            await Fetch<T>($"{AppSettings.APIEndpoint}{url}", method, null, null, queryOptions);

        public async Task<APIResponse<T>> FetchAPI<T>(string url, HttpMethod method, AuthMode authMode, params (string key, string value)[] queryOptions) =>
            await Fetch<T>($"{AppSettings.APIEndpoint}{url}", method, authMode, null, queryOptions);

        public async Task<APIResponse<T>> FetchAPI<T>(string url, HttpMethod method, Dictionary<string, string> body, params (string key, string value)[] queryOptions) =>
            await Fetch<T>($"{AppSettings.APIEndpoint}{url}", method, null, body, queryOptions);

        public async Task<APIResponse<T>> FetchAPI<T>(string url, HttpMethod method, AuthMode authMode, Dictionary<string, string> body, params (string key, string value)[] queryOptions) =>
            await Fetch<T>($"{AppSettings.APIEndpoint}{url}", method, authMode, body, queryOptions);

        protected async Task<APIResponse<T>> Fetch<T>(string fullUrl, HttpMethod method, AuthMode authMode = null, Dictionary<string, string> body = null, params (string key, string value)[] queryOptions)
        {
            APIResponse<T> APIResponse = new APIResponse<T>();
            using (var httpClient = new HttpClient())
            {
                // Build query
                var uriBuilder = new UriBuilder($"{fullUrl}");
                var query = HttpUtility.ParseQueryString(uriBuilder.Query);
                foreach (var queryOption in queryOptions)
                {
                    query.Add(queryOption.key, queryOption.value);
                }
                uriBuilder.Query = query.ToString();

                // Build request
                var request = new HttpRequestMessage()
                {
                    RequestUri = new Uri(uriBuilder.ToString()),
                    Method = method,
                    Content = body == null ? null : new FormUrlEncodedContent(body)
                };

                request.Headers.Add("user-agent", $"ShareGit-{AppSettings.ClientId}-asp.net-core.3.1");
                request.Headers.Add("ContentType", "application/x-www-form-urlencoded");
                request.Headers.Add("Accept", new string[] {
                    "application/json",

                    "application/vnd.github.machine-man-preview+json",
                    "application/vnd.github.v3+json",
                });

                // Add authentication
                authMode?.AddAuthHeader(request.Headers);

                // Run request
                using var response = await httpClient.SendAsync(request);

                if ((int)response.StatusCode < 200 || (int)response.StatusCode >= 400)
                    throw new NotFoundException();

                APIResponse.RequestUri = response.RequestMessage.RequestUri.ToString();
                APIResponse.RAW = await response.Content.ReadAsStringAsync();
                try
                {
                    APIResponse.Value = JsonConvert.DeserializeObject<T>(APIResponse.RAW, new JsonSerializerSettings
                    {
                        ContractResolver = new DefaultContractResolver
                        {
                            NamingStrategy = new SnakeCaseNamingStrategy()
                        },
                        Formatting = Formatting.Indented
                    });
                }
                catch (Exception ex)
                {
                    APIResponse.Err = ex.Message;
                }

                APIResponse.Headers = response.Headers.ToDictionary(x => x.Key, x => string.Join(',', x.Value));
                if (APIResponse.Headers.TryGetValue("X-RateLimit-Remaining", out string rateLimitStr))
                    APIResponse.RemainingLimit = int.Parse(rateLimitStr);
            }

            return APIResponse;
        }
    }
}

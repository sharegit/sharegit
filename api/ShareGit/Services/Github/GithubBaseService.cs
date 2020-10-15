using Core.Model;
using Core.Model.Github;
using Microsoft.Extensions.Options;
using ShareGit.GithubAuth;
using ShareGit.Settings;
using System.Collections.Generic;
using System.Net.Http;
using System.Threading.Tasks;

namespace ShareGit.Services
{
    public abstract class GithubBaseService : BaseService<GithubAppSettings>
    {
        public GithubBaseService(IOptions<GithubAppSettings> appSettings) : base(appSettings)
        {

        }
        /// <summary>
        /// https://docs.github.com/en/rest/reference/apps#get-a-user-installation-for-the-authenticated-app
        /// </summary>
        public async Task<APIResponse<GithubUserInstallation>> GetInstallation(string user)
        {
            return await FetchAPI<GithubUserInstallation>(
                $"/users/{user}/installation",
                HttpMethod.Get,
                new AppGithubAuth());
        }
        /// <summary>
        /// https://docs.github.com/en/rest/reference/apps#create-an-installation-access-token-for-an-app
        /// </summary>
        public async Task<APIResponse<GithubInstallationAccessRequest>> GetAccessToken(int installationId)
        {
            return await FetchAPI<GithubInstallationAccessRequest>(
                $"/app/installations/{installationId}/access_tokens",
                HttpMethod.Post,
                new AppGithubAuth());
        }
        /// <summary>
        /// https://docs.github.com/en/rest/reference/apps#list-app-installations-accessible-to-the-user-access-token
        /// Paginated response
        /// </summary>
        public async Task<APIResponse<PaginatedGithubResponse<GithubUserInstallation>>> GetUserInstallations(GithubUserAccess userAccessToken)
        {
            return await FetchGithubAPIRecursively<GithubUserInstallations, GithubUserInstallation>(
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


        protected async Task<APIResponse<PaginatedGithubResponse<TInner>>> FetchGithubAPIRecursively<TPage, TInner>(string url, HttpMethod method, AuthMode authMode = null, Dictionary<string, string> body = null, params (string key, string value)[] queryOptions)
            where TPage : PaginatedGithubResponse<TInner>
        {
            List<TInner> values = new List<TInner>();
            int valuesCount = 0;
            int? totalValues = null;
            APIResponse<TPage> currentResponse = null;
            System.Array.Resize(ref queryOptions, queryOptions.Length + 2);
            int page = 1;
            do
            {
                var fullUrl = $"{AppSettings.APIEndpoint}{url}";
                queryOptions[queryOptions.Length - 2] = ("page", page.ToString());
                page++;
                queryOptions[queryOptions.Length - 1] = ("per_page", "100");
                currentResponse = currentResponse switch
                {
                    null => await Fetch<TPage> ($"{fullUrl}", method, authMode, body, queryOptions),
                    _ when (valuesCount < totalValues) => await Fetch<TPage>($"{fullUrl}", method, authMode, body, queryOptions),
                    _ => null
                };
                if (currentResponse?.Value?.Get() != null)
                {
                    var results = currentResponse.Value.Get();
                    valuesCount += results.Length;
                    totalValues = totalValues switch
                    {
                        null => currentResponse.Value.TotalCount,
                        _ => System.Math.Min(totalValues.Value, currentResponse.Value.TotalCount)
                    };
                    values.AddRange(currentResponse.Value.Get());
                }
            } while (currentResponse != null);
            return new APIResponse<PaginatedGithubResponse<TInner>>()
            {
                RAW = "",
                RemainingLimit = 0,
                Value = new PaginatedGithubResponse<TInner>()
                {
                    TotalCount = valuesCount,
                    Values = values.ToArray()
                }
            };
        }
    }
}

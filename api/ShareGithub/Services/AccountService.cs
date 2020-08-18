using Core.Model;
using Core.Model.Github;
using Core.Util;
using Microsoft.Extensions.Options;
using ShareGithub.GithubAuth;
using ShareGithub.Settings;
using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;

namespace ShareGithub.Services
{
    public class AccountService : GithubBaseService, IAccountService
    {
        IOptions<GithubAppSettings> GithubAppSettings { get; }
        public AccountService(IOptions<GithubAppSettings> githubAppSettings)
        {
            GithubAppSettings = githubAppSettings;
        }
        /// <summary>
        /// https://docs.github.com/en/developers/apps/identifying-and-authorizing-users-for-github-apps#web-application-flow
        /// </summary>
        public async Task<GithubAPIResponse<GithubWebFlowAccessToken>> AuthUserWithGithub(string code, string state)
        {
            return await FetchGithubAPI<GithubWebFlowAccessToken>(
                "/login/oauth/access_token", HttpMethod.Post, null,
                ("client_id", GithubAppSettings.Value.ClientId),
                ("client_secret", RollingEnv.Get("SHARE_GITHUB_CLIENT_SECRET")),
                ("code", code),
                ("state", state),
                ("redirect_uri", GithubAppSettings.Value.RedirectUrl));
        }
        /// <summary>
        /// https://docs.github.com/en/developers/apps/refreshing-user-to-server-access-tokens#renewing-a-user-token-with-a-refresh-token
        /// </summary>
        public async Task<GithubAPIResponse<GithubWebFlowAccessToken>> RefreshAuthWithGithub(string refreshToken)
        {
            return await FetchGithubAPI<GithubWebFlowAccessToken>(
                "/login/oauth/access_token",
                HttpMethod.Post,
                null,
                ("client_id", GithubAppSettings.Value.ClientId),
                ("client_secret", RollingEnv.Get("SHARE_GITHUB_CLIENT_SECRET")),
                ("refresh_token", refreshToken),
                ("grant_type", "refresh_token"),
                ("redirect_uri", GithubAppSettings.Value.RedirectUrl));
        }

        /// <summary>
        /// https://docs.github.com/en/rest/reference/users#get-the-authenticated-user
        /// </summary>
        public async Task<GithubAPIResponse<GithubUserInfo>> GetUserInfo(GithubUserAccess access)
        {
            return await FetchGithubAPI<GithubUserInfo>(
                "/user",
                HttpMethod.Get,
                new UserGithubAuth(access));
        }
    }
}

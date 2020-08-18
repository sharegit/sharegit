﻿using Core.Model;
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
        public async Task<GithubAPIResponse> AuthUserWithGithub(string code, string state)
        {
            return await FetchGithubAPI("https://github.com/login/oauth/access_token", HttpMethod.Post, null,
                ("client_id", GithubAppSettings.Value.ClientId),
                ("client_secret", RollingEnv.Get("SHARE_GITHUB_CLIENT_SECRET")),
                ("code", code),
                ("state", state),
                ("redirect_uri", GithubAppSettings.Value.RedirectUrl));
        }
        public async Task<GithubAPIResponse> RefreshAuthWithGithub(string refreshToken)
        {
            return await FetchGithubAPI("https://github.com/login/oauth/access_token", HttpMethod.Post, null,
                ("client_id", GithubAppSettings.Value.ClientId),
                ("client_secret", RollingEnv.Get("SHARE_GITHUB_CLIENT_SECRET")),
                ("refresh_token", refreshToken),
                ("grant_type", "refresh_token"),
                ("redirect_uri", GithubAppSettings.Value.RedirectUrl));
        }

        public async Task<GithubAPIResponse> GetUserInfo(GithubUserAccess access)
        {
            return await FetchGithubAPI("https://api.github.com/user", HttpMethod.Get, new UserGithubAuth(access));
        }
    }
}

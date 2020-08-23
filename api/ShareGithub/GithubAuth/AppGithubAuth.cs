using Core.Util;
using System;
using System.Net.Http.Headers;

namespace ShareGithub.GithubAuth
{
    class AppGithubAuth : AuthMode
    {
        private string jwt;

        public AppGithubAuth()
        {
            var payload = new
            {
                iat = DateTimeOffset.UtcNow.ToUnixTimeSeconds(),
                exp = DateTimeOffset.UtcNow.AddMinutes(9).AddSeconds(30).ToUnixTimeSeconds(),
                // TODO: Move app ID to configuration
                iss = 76016
            };

            jwt = JWT.Encode(payload, RollingEnv.Get("SHARE_GIT_GITHUB_APP_PRIV_KEY_LOC"));
        }

        public override void AddAuthHeader(HttpRequestHeaders headers)
        {
            headers.Add("Authorization", $"Bearer {jwt}");
        }

    }
}

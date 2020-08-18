using Core.Model.Github;
using System;
using System.Collections.Generic;
using System.Net.Http.Headers;
using System.Text;

namespace ShareGithub.GithubAuth
{
    public class UserGithubAuth : GithubAuthMode
    {
        private GithubUserAccess UserAccess { get; }
        public UserGithubAuth(GithubUserAccess userAccess)
        {
            UserAccess = userAccess;
        }
        public override void AddAuthHeader(HttpRequestHeaders headers)
        {
            headers.Add("Authorization", $"token {UserAccess.AccessToken}");
        }
    }
}

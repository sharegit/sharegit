using Core.Model.Github;
using System.Net.Http.Headers;

namespace ShareGit.GithubAuth
{
    public class UserGithubAuth : AuthMode
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

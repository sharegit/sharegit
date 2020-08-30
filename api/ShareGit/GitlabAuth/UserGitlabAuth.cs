using Core.Model.GitLab;
using ShareGit.GithubAuth;
using System.Net.Http.Headers;

namespace ShareGit.GitlabAuth
{
    class UserGitlabAuth : AuthMode
    {
        private GitlabUserAccess UserAccess { get; }
        public UserGitlabAuth(GitlabUserAccess userAccess)
        {
            UserAccess = userAccess;
        }
        public override void AddAuthHeader(HttpRequestHeaders headers)
        {
            headers.Add("Authorization", $"Bearer {UserAccess.AccessToken}");
        }
    }
}

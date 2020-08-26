using ShareGithub.GithubAuth;
using System;
using System.Net.Http.Headers;
using System.Text;

namespace ShareGithub.BitbucketAuth
{
    public class AppBitbucketAuth : AuthMode
    {
        private string Auth { get; }
        public AppBitbucketAuth(string clientId, string clientSecret)
        {
            Auth = Convert.ToBase64String(Encoding.ASCII.GetBytes($"{clientId}:{clientSecret}"));
        }
        public override void AddAuthHeader(HttpRequestHeaders headers)
        {
            headers.Add("Authorization", $"Basic {Auth}");
        }
    }
}

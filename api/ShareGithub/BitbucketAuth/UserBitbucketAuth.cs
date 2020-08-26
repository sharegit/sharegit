using Core.Model.Bitbucket;
using ShareGithub.GithubAuth;
using System.Net.Http.Headers;

namespace ShareGithub.BitbucketAuth
{
    public class UserBitbucketAuth : AuthMode
    {
        private BitbucketUserAccess UserAccess { get; }
        public UserBitbucketAuth(BitbucketUserAccess userAccess)
        {
            UserAccess = userAccess;
        }
        public override void AddAuthHeader(HttpRequestHeaders headers)
        {
            headers.Add("Authorization", $"Bearer {UserAccess.AccessToken}");
        }
    }
}

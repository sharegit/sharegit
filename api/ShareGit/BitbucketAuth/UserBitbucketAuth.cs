using Core.Model.Bitbucket;
using ShareGit.GithubAuth;
using System.Net.Http.Headers;

namespace ShareGit.BitbucketAuth
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

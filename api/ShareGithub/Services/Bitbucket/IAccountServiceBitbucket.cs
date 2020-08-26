using Core.Model.Bitbucket;
using System.Threading.Tasks;

namespace ShareGithub.Services
{
    public interface IAccountServiceBitbucket
    {
        Task<BitbucketAPIResponse<BitbucketWebFlowAccessToken>> AuthUserWithBitbucket(string code, string state);
        Task<BitbucketAPIResponse<BitbucketUserInfo>> GetUserInfo(BitbucketUserAccess accessToken);
    }
}

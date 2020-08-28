using Core.Model;
using Core.Model.Bitbucket;
using System.Threading.Tasks;

namespace ShareGithub.Services
{
    public interface IAccountServiceBitbucket
    {
        Task<APIResponse<BitbucketWebFlowAccessToken>> AuthUserWithBitbucket(string code, string state);
        Task<APIResponse<BitbucketUserInfo>> GetUserInfo(BitbucketUserAccess accessToken);
    }
}

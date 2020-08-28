using Core.Model;
using Core.Model.Bitbucket;
using System.Threading.Tasks;

namespace ShareGithub
{
    public interface IRepositoryServiceBitbucket
    {
        Task<APIResponse<PaginatedBitbucketResponse<BitbucketRepository>>> GetRepositories(BitbucketUserAccess userAccess);
        Task<APIResponse<PaginatedBitbucketResponse<BitbucketBranch>>> GetBranches(string workspaceSlug, string slug, BitbucketUserAccess userAccess);
        Task<APIResponse<PaginatedBitbucketResponse<BitbucketDirecotryObject>>> GetDirectoryContent(string workspace, string slug, string sha, string uri, BitbucketUserAccess userAccess);
        Task<APIResponse<string>> GetContent(string workspace, string slug, string sha, string uri, BitbucketUserAccess userAccess);
    }
}

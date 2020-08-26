using Core.Model.Bitbucket;
using Core.Model.GitLab;
using System.Threading.Tasks;

namespace ShareGithub
{
    public interface IRepositoryServiceBitbucket
    {
        Task<BitbucketAPIResponse<PaginatedBitbucketResponse<BitbucketRepository>>> GetRepositories(BitbucketUserAccess userAccess);
        Task<BitbucketAPIResponse<PaginatedBitbucketResponse<BitbucketBranch>>> GetBranches(string workspaceSlug, string slug, BitbucketUserAccess userAccess);

    }
}

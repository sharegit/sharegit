using System.Collections.Generic;

namespace ShareGit.Models
{
    public class Account : DbItemBase
    {
        public string Name { get; set; }
        public string DisplayName { get; set; }
        public string Email { get; set; }
        public string RequestedDeletionToken { get; set; }
        public List<SharedToken> SharedTokens { get; set; } = new List<SharedToken>();
        public GithubConnectedService GithubConnection { get; set; } = null;
        public GitlabConnectedService GitlabConnection { get; set; } = null;
        public BitbucketConnectedService BitbucketConnection { get; set; } = null;
    }
}
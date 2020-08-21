using System.Collections.Generic;

namespace ShareGithub.Models
{
    public class Account : DbItemBase
    {
        public int GithubId { get; set; }
        public string Name { get; set; }
        public string DisplayName { get; set; }
        public string Login { get; set; }
        public string EncodedAccessToken { get; set; }
        public string EncodedRefreshToken { get; set; }
        public long AccessTokenExp { get; set; }
        public long RefreshTokenExp { get; set; }
        public List<SharedToken> SharedTokens { get; set; } = new List<SharedToken>();
    }
}
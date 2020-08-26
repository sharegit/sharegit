namespace ShareGithub.Models
{
    public class BitbucketConnectedService
    {
        public string BitbucketId { get; set; }
        public string EncodedAccessToken { get; set; }
        public string EncodedRefreshToken { get; set; }
        public long AccessTokenExp { get; set; }
    }
}

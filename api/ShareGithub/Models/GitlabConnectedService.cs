namespace ShareGithub.Models
{
    public class GitlabConnectedService
    {
        public string Login { get; set; }
        public int GitlabId { get; set; }
        public string EncodedAccessToken { get; set; }
        public string EncodedRefreshToken { get; set; }
        public long AccessTokenExp { get; set; }
    }
}

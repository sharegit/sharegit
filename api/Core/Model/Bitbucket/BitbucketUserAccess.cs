namespace Core.Model.Bitbucket
{
    public class BitbucketUserAccess
    {
        public string UserId { get; set; }
        public string AccessToken { get; set; }
        public string RefreshToken { get; set; }
        public long AccessTokenExp { get; set; }
    }
}

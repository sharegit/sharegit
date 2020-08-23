namespace Core.Model.GitLab
{
    public class GitlabWebFlowAccessToken
    {
        public string AccessToken { get; set; }
        public long ExpiresIn { get; set; }
        public string RefreshToken { get; set; }
    }
}

namespace Core.APIModels
{
    public class SettingsInfo
    {
        public string Email { get; set; }
        public string Name { get; set; }
        public string DisplayName { get; set; }
        public string Url { get; set; }
        public string Bio { get; set; }
        public bool GithubConnected { get; set; }
        public bool GitLabConnected { get; set; }
        public bool BitbucketConnected { get; set; }
    }
}

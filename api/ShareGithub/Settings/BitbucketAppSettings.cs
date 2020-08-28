namespace ShareGithub.Settings
{
    public class BitbucketAppSettings : IAppSettings
    {
        public string ClientId { get; set; }
        public string RedirectUrl { get; set; }
        public string APIEndpoint { get; set; }
        public string SiteEndpoint { get; set; }
    }
}

namespace ShareGit.Settings
{
    public interface IAppSettings
    {
        string ClientId { get; }
        string RedirectUrl { get; }
        string APIEndpoint { get; }
        string SiteEndpoint { get; }
    }
}

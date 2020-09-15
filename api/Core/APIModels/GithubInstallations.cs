namespace Core.APIModels
{
    public class GithubInstallations
    {
        public class GithubInstallation
        {
            public string Login { get; set; }
            public bool Implicit { get; set; }
        }
        public GithubInstallation[] Installations { get; set; } = new GithubInstallation[0];
    }
}

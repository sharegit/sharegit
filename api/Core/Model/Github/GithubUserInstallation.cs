namespace Core.Model.Github
{
    public class GithubUserInstallation
    {
        public class AccountObject
        {
            public string Login { get; set; }
        }
        public int Id { get; set; }
        public AccountObject Account { get; set; }
    }
}

namespace ShareGit.GithubAuth
{
    abstract public class AuthMode
    {
        public abstract void AddAuthHeader(System.Net.Http.Headers.HttpRequestHeaders headers);
    }
}

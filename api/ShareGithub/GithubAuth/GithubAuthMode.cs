namespace ShareGithub.GithubAuth
{
    abstract public class GithubAuthMode
    {
        public abstract void AddAuthHeader(System.Net.Http.Headers.HttpRequestHeaders headers);
    }
}

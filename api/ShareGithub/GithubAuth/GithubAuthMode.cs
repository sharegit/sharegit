namespace ShareGithub.GithubAuth
{
    abstract class GithubAuthMode
    {
        public abstract void AddAuthHeader(System.Net.Http.Headers.HttpRequestHeaders headers);
    }
}

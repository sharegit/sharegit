namespace Core.Model.Github
{
    public class GithubAPIResponse<T>
    {
        public string RAW { get; set; }
        public T Value { get; set; }
        public int RemainingLimit { get; set; }
    }
}

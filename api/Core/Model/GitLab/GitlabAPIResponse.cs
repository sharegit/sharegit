namespace Core.Model.GitLab
{
    public class GitlabAPIResponse<T>
    {
        public string RAW { get; set; }
        public T Value { get; set; }
        public int RemainingLimit { get; set; }
    }
}

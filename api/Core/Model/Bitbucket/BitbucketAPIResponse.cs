namespace Core.Model.Bitbucket
{
    public class BitbucketAPIResponse<T>
    {
        public string RAW { get; set; }
        public T Value { get; set; }
        public int RemainingLimit { get; set; }
    }
}

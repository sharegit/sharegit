namespace Core.Model.Bitbucket
{
    public class PaginatedBitbucketResponse<T>
    {
        public int PageLen { get; set; }
        public T[] Values { get; set; }
        public string Next { get; set; }
    }
}

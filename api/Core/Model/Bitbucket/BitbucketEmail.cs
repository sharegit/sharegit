namespace Core.Model.Bitbucket
{
    public class BitbucketEmail
    {
        public bool IsPrimary { get; set; }
        public bool IsConfirmed { get; set; }
        public string Type { get; set; }
        public string Email { get; set; }
    }
}

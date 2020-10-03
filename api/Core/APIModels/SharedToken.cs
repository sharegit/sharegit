namespace Core.APIModels
{
    public class SharedToken
    {
        public string Token { get; set; }
        public string CustomName { get; set; }
        /// <summary>
        /// Expiration date in UTC minutes
        /// </summary>
        public long ExpireDate { get; set; }
        public string Author { get; set; }
        public string AuthorWebsite { get; set; }
        public string AuthorBio { get; set; }
        public SharedRepository[] Repositories { get; set; }
    }
}

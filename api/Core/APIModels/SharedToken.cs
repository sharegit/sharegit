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
    }
}

﻿namespace ShareGit.Models
{
    public class BitbucketConnectedService
    {
        public string Username { get; set; }
        public string BitbucketId { get; set; }
        public string EncodedAccessToken { get; set; }
        public string EncodedRefreshToken { get; set; }
        public long AccessTokenExp { get; set; }
    }
}

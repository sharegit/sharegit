﻿namespace Core.Model.Bitbucket
{
    public class BitbucketWebFlowAccessToken
    {
        public string AccessToken { get; set; }
        public long ExpiresIn { get; set; }
        public string RefreshToken { get; set; }
    }
}

﻿using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace ShareGit.Models
{
    public class SharedToken
    {
        public string Token { get; set; }
        public string Stamp { get; set; }

        [BsonRepresentation(BsonType.ObjectId)]
        public string SharingUserId { get; set; }
        public string CustomName { get; set; }
        public string PrivateNote { get; set; }
        // Expiration date in UTC minutes!
        public long ExpireDate { get; set; }
    }
}

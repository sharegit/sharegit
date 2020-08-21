using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace ShareGithub.Models
{
    public class SharedToken
    {
        public string Token { get; set; }
        public string Stamp { get; set; }

        [BsonRepresentation(BsonType.ObjectId)]
        public string SharingUserId { get; set; }
    }
}

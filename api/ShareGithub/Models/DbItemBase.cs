using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace ShareGithub.Models
{
    public class DbItemBase
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; }
    }
}
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace ShareGit.Models
{
    public class DbItemBase : IDbItemBase
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; }
    }
}
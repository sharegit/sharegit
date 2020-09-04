using MongoDB.Bson.Serialization.Attributes;

namespace ShareGit.Models
{
    public class Share : IDbItemBase
    {
        [BsonId]
        public string Id { get; set; }
        public SharedToken Token { get; set; }
        public Repository[] AccessibleRepositories { get; set; }
    }
}

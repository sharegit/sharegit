using Core.Util;
using Microsoft.Extensions.Options;
using MongoDB.Driver;
using ShareGit.Models;
using ShareGit.Settings;
using System;
using System.Collections.Generic;
using System.Linq;

namespace ShareGit.Repositories
{
    public class RepositoryBase<T, S> : IRepository<T, S>
        where T : DbItemBase
        where S : DatabaseSettingsBase, new()
    {
        private readonly IMongoCollection<T> data;

        public RepositoryBase(IOptions<S> settings)
        {
            var usr = RollingEnv.Get("SHARE_GIT_DB_USR");
            var psw = RollingEnv.Get("SHARE_GIT_DB_PSW");
            var connectionString = settings.Value.ConnectionString.Replace("{user}", usr).Replace("{password}", psw);
            var client = new MongoClient(connectionString);
            var database = client.GetDatabase(settings.Value.Database);

            data = database.GetCollection<T>(settings.Value.Collection);
        }

        public List<T> Get()
        {
            return data.Find(x => true).ToList();
        }

        public T Find(Func<T, bool> predicate)
        {
            return data.AsQueryable<T>().Where(predicate).FirstOrDefault();
        }

        public T Get(string id)
        {
            return data.Find<T>(x => x.Id == id).FirstOrDefault();
        }

        public T Create(T newEntry)
        {
            data.InsertOne(newEntry);
            return newEntry;
        }

        public void Update(string id, T TIn)
        {
            data.ReplaceOne(x => x.Id == id, TIn);
        }

        public void Remove(T TIn)
        {
            data.DeleteOne(x => x.Id == TIn.Id);
        }

        public void Remove(string id)
        {
            data.DeleteOne(x => x.Id == id);
        }
    }
}
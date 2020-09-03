using Core.Util;
using Microsoft.Extensions.Options;
using MongoDB.Driver;
using ShareGit.Models;
using ShareGit.Settings;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

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
        public async Task<List<T>> GetAsync()
        {
            return (await data.FindAsync(x => true)).ToList();
        }

        public T Find(Func<T, bool> predicate)
        {
            return data.AsQueryable<T>().Where(predicate).FirstOrDefault();
        }

        public T Get(string id)
        {
            return data.Find<T>(x => x.Id == id).FirstOrDefault();
        }
        public async Task<T> GetAsync(string id)
        {
            var find = await data.FindAsync(x => x.Id == id);
            return await find.FirstOrDefaultAsync();
        }

        public T Create(T newEntry)
        {
            data.InsertOne(newEntry);
            return newEntry;
        }
        public async Task<T> CreateAsync(T newEntry)
        {
            await data.InsertOneAsync(newEntry);
            return newEntry;
        }

        public void Update(string id, T TIn)
        {
            data.ReplaceOne(x => x.Id == id, TIn);
        }
        public async Task UpdateAsync(string id, T TIn)
        {
            await data.ReplaceOneAsync(x => x.Id == id, TIn);
        }

        public void Remove(T TIn)
        {
            data.DeleteOne(x => x.Id == TIn.Id);
        }
        public async Task RemoveAsync(T TIn)
        {
            await data.DeleteOneAsync(x => x.Id == TIn.Id);
        }

        public void Remove(string id)
        {
            data.DeleteOne(x => x.Id == id);
        }
        public async Task RemoveAsync(string id)
        {
            await data.DeleteOneAsync(x => x.Id == id);
        }
    }
}
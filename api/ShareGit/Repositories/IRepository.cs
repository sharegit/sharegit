using ShareGit.Models;
using ShareGit.Settings;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ShareGit.Repositories
{
    public interface IRepository<T, S>
            where T : IDbItemBase
            where S : DatabaseSettingsBase, new()
    {
        List<T> Get();
        Task<List<T>> GetAsync();
        T Get(string id);
        Task<T> GetAsync(string id);
        T Find(Func<T, bool> predicate);
        T Create(T newEntry);
        Task<T> CreateAsync(T newEntry);
        void Update(string id, T TIn);
        Task UpdateAsync(string id, T TIn);
        void Remove(T TIn);
        Task RemoveAsync(T TIn);
        void Remove(string id);
        Task RemoveAsync(string id);
    }
}

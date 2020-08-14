﻿using ShareGithub.Models;
using System;
using System.Collections.Generic;
using WebAPI.Settings;

namespace ShareGithub.Repositories
{
    public interface IRepository<T, S>
            where T : DbItemBase
            where S : DatabaseSettingsBase, new()
    {
        List<T> Get();
        T Get(string id);
        T Find(Func<T, bool> predicate);
        T Create(T newEntry);
        void Update(string id, T TIn);
        void Remove(T TIn);
        void Remove(string id);
    }
}
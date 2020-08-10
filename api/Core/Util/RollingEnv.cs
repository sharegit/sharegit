using System;

namespace Core.Util
{
    public class RollingEnv
    {
        public static string Get(string envName)
        {
            var machine = Environment.GetEnvironmentVariable(envName, EnvironmentVariableTarget.Machine);
            var user = Environment.GetEnvironmentVariable(envName, EnvironmentVariableTarget.User);
            var process = Environment.GetEnvironmentVariable(envName, EnvironmentVariableTarget.Process);

            return (process ?? user) ?? machine;
        }
    }
}

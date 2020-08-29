using System.Threading.Tasks;

namespace EmailTemplates
{
    public interface IRazorStringRenderer
    {
        Task<string> RenderAsync<TModel>(string viewName, TModel model);
    }
}

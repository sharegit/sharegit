using Microsoft.AspNetCore.Mvc;
using ShareGit.Services.Google;
using System.Threading.Tasks;

namespace WebAPI.Controllers
{
    [Route("an")]
    [ApiController]
    public class AnalyticsController : ControllerBase
    {
        private IMeasurementService MeasurementService { get; }
        public AnalyticsController(IMeasurementService measurementService)
        {
            MeasurementService = measurementService;
        }

        [HttpPost("hit")]
        public async Task<ActionResult> HitPage([FromQuery] string path, [FromQuery] string cid)
        {
            await MeasurementService.Hit(path, cid);
            return new OkResult();
        }
    }
}

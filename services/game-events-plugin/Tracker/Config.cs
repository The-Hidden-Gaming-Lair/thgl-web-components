namespace Tracker
{
  internal class Config
  {
    public string? ProcessName { get; set; } = null;
    public string[] ActorNames { get; set; } = [];
    public string URI { get; set; } = "";
    public string AppVersion { get; set; } = "";
    public int PollingInterval { get; set; } = 10000;
  }
}

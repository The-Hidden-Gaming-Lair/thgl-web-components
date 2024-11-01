namespace Tracker
{
  internal class Config
  {
    public string? ProcessName { get; set; } = null;
    public string[] ModuleNames { get; set; } = [];
    public string[] ActorNames { get; set; } = [];
  }
}

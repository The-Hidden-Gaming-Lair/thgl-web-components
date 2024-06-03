
using System.Diagnostics;
using System.Net.Http.Headers;
using GameEventsPlugin;
using GameEventsPlugin.Actions;
using Newtonsoft.Json;

namespace Tracker
{

  internal class Program
  {
    private static HttpClient _httpClient = new HttpClient();
    private static Config? _config = null;

    static async Task Main(string[] args)
    {
      Console.WriteLine("Hello, thx for your help!");

      var configFilePath = args.Length > 0 ? args[0] : "Config.json";
      if (File.Exists(configFilePath))
      {
        LoadConfig(configFilePath);
        Console.WriteLine("Loaded config: " + configFilePath);
        Console.WriteLine("ProcessName: " + _config.ProcessName);
        Console.WriteLine("ActorNames: " + string.Join(", ", _config.ActorNames));
        Console.WriteLine("URI: " + _config.URI);
        Console.WriteLine("AppVersion: " + _config.AppVersion);
      }

      Console.WriteLine("Searching for process...");

      Process? process = null;
      var pollInterval = _config?.PollingInterval ?? 10000;
      long[] lastAddresses = [];
      var fileName = @"C:\Wuthering Waves\Wuthering Waves Game\Wuthering Waves.exe"; ;
      UnrealEngine? unrealEngine = null;

      while (true)
      {
        try
        {
          UEObject.Reset();

          if (process == null)
          {

            if (fileName != null)
            {
              process = new Process();
              process.StartInfo.FileName = fileName;
              process.StartInfo.UseShellExecute = true;
              process.StartInfo.Verb = "runas"; // Run as administrator
              process.Start();
            }
            else if (_config != null)
            {
              var processes = Process.GetProcessesByName(_config.ProcessName);
              if (processes.Count() == 0)
              {
                throw new Exception("Can not find process");
              }
              process = processes[0];
              if (process == null || process.HasExited)
              {
                throw new Exception("Can not find process");
              }
            }
            else
            {
              var window = Memory.FindWindowEx(IntPtr.Zero, IntPtr.Zero, "UnrealWindow", null);
              if (window != IntPtr.Zero)
              {
                Memory.GetWindowThreadProcessId(window, out Int32 unrealProcId);
                process = Process.GetProcessById(unrealProcId);
              }
              if (process == null || process.HasExited)
              {
                throw new Exception("Can not find process");
              }
            }
            Console.WriteLine("Found process: " + process.ProcessName);
          }
          Console.WriteLine("Found process: " + process.ProcessName + " Base Address " +process.MainModule.BaseAddress);
          if (!UnrealEngine.IsReady)
          {
            unrealEngine = new UnrealEngine(new Memory(process));
            unrealEngine.UpdateAddresses();
            Console.WriteLine("Updated Addresses");
          }
          var address = UnrealEngine.Memory.ReadProcessMemory<IntPtr>(UnrealEngine.GWorldPtr);
          var owningWorld = new UEObject(address);
          if (owningWorld == null)
          {
            Console.WriteLine("Can not find owning world");
            return;
          }
          var levels = owningWorld["Levels"] ?? owningWorld["levels"];
          if (levels == null)
          {
            Console.WriteLine("Can not find levels");
            return;
          }

          var GameState = owningWorld["GameState"];
          var owningGameInstance = owningWorld["OwningGameInstance"];

          var actorNames = _config?.ActorNames ?? [];
          var actors = Actors.GetActors(levels, actorNames);

          // Group the actors by type and count them
          var groupedActors = actors.GroupBy(a => a.type).Select(g => new { type = g.Key, count = g.Count() });
          // Sort them by count
          groupedActors = groupedActors.OrderByDescending(a => a.count);
          // Log the grouped actors
          foreach (var actor in groupedActors)
          {
            Console.WriteLine($"{actor.type}: {actor.count}");
          }

          var newAddresses = actors.Select(a => a.address).ToArray();
          var newActors = actors.Where(a => !lastAddresses.Contains(a.address)).ToArray();
          lastAddresses = newAddresses;

          var jsonString = JsonConvert.SerializeObject(newActors);

          if (_config != null)
          {
            var request = new HttpRequestMessage
            {
              Method = HttpMethod.Post,
              RequestUri = new Uri(_config.URI),
              Headers =
              {
                  { "app-version", _config.AppVersion },
              },
              Content = new StringContent(jsonString)
              {
                Headers =
                {
                    ContentType = new MediaTypeHeaderValue("application/json")
                }
              }
            };

            using (var response = await _httpClient.SendAsync(request))
            {
              response.EnsureSuccessStatusCode();
              var body = await response.Content.ReadAsStringAsync();
              Console.WriteLine(body);
            }
          }
        }
        catch (Exception e)
        {
          Console.WriteLine($"Error!!!: {e.Message} {e.StackTrace}");
        }
        Thread.Sleep(pollInterval);
      }
    }

    private static void LoadConfig(string configFilePath)
    {
      var json = File.ReadAllText(configFilePath);
      _config = JsonConvert.DeserializeObject<Config>(json);
    }
  }
}

using Newtonsoft.Json;
using GameEventsPlugin;
namespace Tracker
{

  internal class Program
  {
    private static Config? _config = null;
    private static Overwolf overwolf = new Overwolf();

    static private void RunOverwolfProcess(string? processName, string[]? moduleNames)
    {
      overwolf.UpdateProcess((success) =>
      {
        Console.WriteLine($"Success: {success}");
      }, (error) =>
      {
        Console.WriteLine("Error: " + error);
      }, processName, moduleNames);
    }
    static private void RunOverwolfPlayer()
    {
      overwolf.GetPlayer((player) =>
      {
        Console.WriteLine("Player: " + JsonConvert.SerializeObject(player));
      }, (error) =>
      {
        Console.WriteLine("Error: " + error);
      });
    }

    static private void RunOverwolfActors(string[] ids)
    {
      overwolf.GetActors(ids, (actors) =>
      {
        //Console.WriteLine("Actors: " + JsonConvert.SerializeObject(actors));
      }, (error) =>
      {
        Console.WriteLine("Error: " + error);

      });
    }

    static async Task Main(string[] args)
    {
      Console.WriteLine("Hi!");
      Console.WriteLine("F1: Refresh Process Addresses");
      Console.WriteLine("F2: Get Player");
      Console.WriteLine("F3: Get Actors");
      Console.WriteLine("F4: Dump to file");

      var configFilePath = args.Length > 0 ? args[0] : "Config.json";
      if (File.Exists(configFilePath))
      {
        LoadConfig(configFilePath);
        Console.WriteLine("Loaded config: " + configFilePath);
        Console.WriteLine("ProcessName: " + _config.ProcessName);
        Console.WriteLine("ModuleName: " + string.Join(", ", _config.ModuleNames)); 
        Console.WriteLine("ActorNames: " + string.Join(", ", _config.ActorNames));
      }


      while (true)
      {
        var key = Console.ReadKey(true).Key;
        if (key == ConsoleKey.F1)
        {

          RunOverwolfProcess(_config?.ProcessName, _config?.ModuleNames);

        }
        if (key == ConsoleKey.F2)
        {
          RunOverwolfPlayer();
        }
        if (key == ConsoleKey.F3)
        {
          RunOverwolfActors(_config?.ActorNames);
        }
        if (key == ConsoleKey.F4)
        {
          Console.WriteLine("Saving Dump");
          overwolf.Debug(list =>
          {
            string[] l = (string[])list;
            File.WriteAllLines("dump.txt", l);
            Console.WriteLine("Saved Dump");
          }, error =>
          {
            Console.WriteLine($"Error: {error}");
          });
        }
      }
    }

    private static void LoadConfig(string configFilePath)
    {
      var json = File.ReadAllText(configFilePath);
      _config = JsonConvert.DeserializeObject<Config>(json);
    }
  }
}
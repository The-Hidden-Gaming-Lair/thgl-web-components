
using System.Diagnostics;
using Newtonsoft.Json;
using GameEventsPlugin;
using System.ComponentModel.Design;
using System.Security.Cryptography;
using GameEventsPlugin.Actions;
namespace Tracker
{

  internal class Program
  {
    private static Config? _config = null;
    private static Overwolf overwolf = new Overwolf();

    static private void RunOverwolfProcess(string? processName)
    {
      overwolf.UpdateProcess((success) =>
      {
        Console.WriteLine($"Success: {success}");
      }, (error) =>
      {
        Console.WriteLine("Error: " + error);
      }, processName);
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
        Console.WriteLine("Actors: " + JsonConvert.SerializeObject(actors));
      }, (error) =>
      {
        Console.WriteLine("Error: " + error);

      });
    }

    static async Task Main(string[] args)
    {
      Console.WriteLine("Hi!");

      var configFilePath = args.Length > 0 ? args[0] : "Config.json";
      if (File.Exists(configFilePath))
      {
        LoadConfig(configFilePath);
        Console.WriteLine("Loaded config: " + configFilePath);
        Console.WriteLine("ProcessName: " + _config.ProcessName);
        Console.WriteLine("ActorNames: " + string.Join(", ", _config.ActorNames));
      }


      while (true)
      {
        var key = Console.ReadKey(true).Key;
        if (key == ConsoleKey.F1)
        {

          RunOverwolfProcess(_config?.ProcessName);

        }
        if (key == ConsoleKey.F2)
        {
          RunOverwolfPlayer();
        }
        if (key == ConsoleKey.F2)
        {
          RunOverwolfActors(_config?.ActorNames);
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

using System;
using System.Diagnostics;
using System.IO;
using System.Threading;
using System.Threading.Tasks;
using GameEventsPlugin;
using GameEventsPlugin.Actions;
using Newtonsoft.Json;
using System.Linq;

namespace Tracker
{

  internal class Program
  {
    private static Config _config = null;
    private static Overwolf overwolf = new Overwolf();

    static object lastError = null;
    static private void RunOverwolfProcess()
    {
      overwolf.UpdateProcess((success) =>
      {
        if (lastError != null)
        {
          Console.WriteLine($"Success: {success}");
        }
        lastError = null;
        Thread.Sleep(50);
        RunOverwolfProcess();
      }, (error) =>
      {
        if (lastError != error)
        {
          Console.WriteLine($"Error: {error}");
        }
        lastError = error;
        Thread.Sleep(200);
        RunOverwolfProcess();
      });
    }
    static private void RunOverwolfPlayer()
    {
      overwolf.GetPlayer((player) =>
      {
        Thread.Sleep(50);
        RunOverwolfPlayer();
      }, (error) =>
      {
        Thread.Sleep(200);
        RunOverwolfPlayer();
      });
    }

    static private void RunOverwolfActors()
    {
      overwolf.GetActors(new String[0], (actors) =>
      {
        Thread.Sleep(500);
        RunOverwolfActors();
      }, (error) =>
      {
        Thread.Sleep(200);
        RunOverwolfActors();
      });
    }

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

      Process process = null;
      var pollInterval = _config?.PollingInterval ?? 2000;
      long[] lastAddresses = new long[0];
      // var fileName = @"C:\Program Files (x86)\Steam\steamapps\common\Palia\Palia\Binaries\Win64\PaliaClientSteam-Win64-Shipping.exe";
      // var fileName = @"C:\Program Files (x86)\Steam\steamapps\common\Palworld\Pal\Binaries\Win64\Palworld-Win64-Shipping.exe";
      // var fileName = @"C:\Program Files (x86)\Steam\steamapps\common\Palworld\Palworld.exe";
      // var fileName = @"C:\Wuthering Waves\Wuthering Waves Game\Client\Binaries\Win64\Client-Win64-Shipping.exe"; ;
      // var fileName = @"C:\Wemade\NightCrowsG\Client\MadGlobal.exe"; ;
      UnrealEngine unrealEngine = null;
      Memory memory = null;

      Task.Run(() =>
      {
        RunOverwolfProcess();
      });
      Task.Run(() =>
      {
        RunOverwolfPlayer();
      });
      Task.Run(() =>
      {
        RunOverwolfActors();
      });
      while (Console.ReadKey(true).Key == ConsoleKey.D)
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

    private static void LoadConfig(string configFilePath)
    {
      var json = File.ReadAllText(configFilePath);
      _config = JsonConvert.DeserializeObject<Config>(json);
    }
  }
}
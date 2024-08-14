
using System;
using System.Diagnostics;
using System.IO;
using System.Threading;
using System.Threading.Tasks;
using Newtonsoft.Json;
using System.Linq;
using GameEventsPlugin;
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
      }, "ONCE_HUMAN");
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
      if (false)
      {
        var startInfo = new ProcessStartInfo
        {
          FileName = @"C:\Program Files (x86)\Windows Kits\10\bin\10.0.26100.0\x64\signtool.exe",
          UseShellExecute = false,
          Arguments = @"sign /tr http://ts.ssl.com /td SHA256 /fd SHA256 /sha1 e58649c35d9f6c4695e5b05dbe6cef4b0ded155d C:\Users\andre\Documents\GitHub\the-hidden-gaming-lair\services\once-human-game-events-plugin\NativeGameEvents\bin\Release\net9.0\publish\win-x64\NativeGameEvents.dll"
          //Arguments = @"sign /debug /sha1 e58649c35d9f6c4695e5b05dbe6cef4b0ded155d /fd SHA256 C:\Users\shalz\Documents\GitHub\PalWorldTrainerApp\x64\Release\PalWorldTrainer.exe"
        };
        // pin is 123456
        var p = Process.Start(startInfo);
        p.WaitForExit();
      }
      while (Console.ReadKey(true).Key == ConsoleKey.D)
      {
        Console.WriteLine("Saving Dump");
        overwolf.Debug(list =>
        {
          string[] l = (string[]) list;
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
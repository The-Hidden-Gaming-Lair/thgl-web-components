
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
    static private void RunOverwolfPlayer()
    {
      overwolf.UpdateProcess((player) =>
      {
        if (lastError != null)
        {
          Console.WriteLine($"Player: {player}");
        }
        lastError = null;
        Thread.Sleep(50);
        RunOverwolfPlayer();
      }, (error) =>
      {
        if (lastError != error)
        {
          Console.WriteLine($"Error: {error}");
        }
        lastError = error;
        Thread.Sleep(200);
        RunOverwolfPlayer();
      }, "Client-Win64-Shipping");
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

      RunOverwolfPlayer();
      RunOverwolfActors();
      while (true)
      {
        Thread.Sleep(20000);
      }
      while (false)
      {
        try
        {
          Thread.Sleep(pollInterval);
          UEObject.Reset();

          if (process == null)
          {
            /*if (fileName != null)
            {
              process = new Process();
              process.StartInfo.FileName = fileName;
              process.StartInfo.UseShellExecute = true;
              process.StartInfo.Verb = "runas"; // Run as administrator
              process.Start();
            }*/
            if (_config != null)
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
            memory = new Memory(process);
            Console.WriteLine("Found process: " + process.ProcessName + " Base Address 0x" + memory?.BaseAddress.ToString("X4"));
          }
          /*else if (process.HasExited)
          {
            Console.WriteLine("Process has exited");
            process = null;
            memory = null;
            continue;
          }*/

          if (!UnrealEngine.IsReady)
          {
            unrealEngine = new UnrealEngine(memory);
            unrealEngine.UpdateAddresses();
            Console.WriteLine("Updated Addresses");
          }
          var address = UnrealEngine.Memory.ReadProcessMemory<IntPtr>(UnrealEngine.GWorldPtr);
          var owningWorld = new UEObject(address);
          if (owningWorld == null)
          {
            Console.WriteLine("Can not find owning world");
            continue;
          }
          var GameState = owningWorld["GameState"];
          if (GameState == null)
          {
            process = null;
            memory = null;
            Console.WriteLine("Can not find GameState -> Reset");
            continue;
          }
          var owningGameInstance = owningWorld["OwningGameInstance"];

          var player = Actors.GetActorPlayer(owningGameInstance);
          if (player == null)
          {
            continue;
          }
          Console.WriteLine($"Player: {player?.x} {player?.y} {player?.path}");

          var levels = owningWorld["Levels"] ?? owningWorld["levels"];
          if (levels == null)
          {
            Console.WriteLine("Can not find levels");
            continue;
          }

          var actorNames = _config?.ActorNames ?? new string[0];
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
        }
        catch (Exception e)
        {
          Console.WriteLine($"Error!!!: {e.Message} {e.StackTrace}");
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
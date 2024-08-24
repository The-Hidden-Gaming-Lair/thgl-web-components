using System.Diagnostics;
using System;
using System.Collections.Generic;
using GameEventsPlugin.Models;
using GameEventsPlugin.Actions;
using System.Threading.Tasks;
using System.Linq;
using System.Security.Principal;

namespace GameEventsPlugin
{
  public class Overwolf
  {
    Process _process = null;
    UEObject _owningWorld = null;
    UEObject _levels = null;
    Memory _memory = null;
    string _lastError = null;

    bool IsElevated
    {
      get
      {
        return WindowsIdentity.GetCurrent().Owner
          .IsWellKnown(WellKnownSidType.BuiltinAdministratorsSid);
      }
    }

    public void UpdateProcess(Action<object> callback, Action<object> error, string processName = null)
    {
      try
      {
       /* if (!IsElevated)
        {
          throw new Exception("Please run as administrator");
        }*/
        if (_memory == null || _process == null)
        {
          _owningWorld = null;
          _levels = null;
          if (processName != null)
          {
            var processes = Process.GetProcessesByName(processName);
            if (processes.Count() == 0)
            {
              throw new Exception("Can not find process");
            }
            _process = processes[0];
            if (_process == null)
            {
              throw new Exception("Can not find process");
            }
          }
          if (_process == null)
          {
            var window = Memory.FindWindowEx(IntPtr.Zero, IntPtr.Zero, "UnrealWindow", null);
            if (window == IntPtr.Zero)
            {
              throw new Exception("Can not find UnrealWindow");
            }
            Memory.GetWindowThreadProcessId(window, out Int32 unrealProcId);
            _process = Process.GetProcessById(unrealProcId);
            if (_process == null)
            {
              throw new Exception("Can not find UnrealWindow");
            }
          }
          Console.WriteLine("New Memory");
          _memory = new Memory(_process);
          var unrealEngine = new UnrealEngine(_memory);
          unrealEngine.UpdateAddresses();
          Console.WriteLine("Updated Addresses");
        }

        var address = UnrealEngine.Memory.ReadProcessMemory<IntPtr>(UnrealEngine.GWorldPtr);
        var owningWorld = new UEObject(address);
        var GameState = owningWorld["GameState"];
        if (GameState == null)
        {
          UEObject.Reset();
          var unrealEngine = new UnrealEngine(_memory);
          unrealEngine.UpdateAddresses();
          throw new Exception("Can not find GameState");
        }
        var levels = owningWorld["Levels"];
        if (levels == null)
        {
          UEObject.Reset();
          var unrealEngine = new UnrealEngine(new Memory(_process));
          unrealEngine.UpdateAddresses();
          throw new Exception("Can not find levels");
        }

        _owningWorld = owningWorld;
        _levels = levels;
        _lastError = null;
        callback(true);
      }
      catch (Exception e)
      {
        _lastError = e.Message;
        UEObject.Reset();
        error(e.Message);
      }
    }

    public void GetPlayer(Action<object> callback, Action<object> error)
    {
      Task.Run(() =>
      {
        try
        {
          if (_lastError != null)
          {
            error(_lastError);
            return;
          }
          if (_owningWorld == null)
          {
            callback(null);
            return;
          }
          var owningGameInstance = _owningWorld["OwningGameInstance"];
          var player = Actors.GetActorPlayer(owningGameInstance);
          if (player != null)
          {
            callback(player);
          }
          else
          {
            callback(null);
          }
        }
        catch (Exception e)
        {
          UEObject.Reset();
          error(e.Message + "\n" + e.StackTrace);
        }
      });
    }

    public void GetActors(string[] types, Action<object> callback, Action<object> error)
    {
      Task.Run(() =>
      {
        try
        {
          var noActors = new List<Actor>();
          if (_levels == null)
          {
            callback(noActors.ToArray());
            return;
          }
          var actors = Actors.GetActors(_levels, types);
          callback(actors.ToArray());
        }
        catch (Exception e)
        {
          error(e.Message + "\n" + e.StackTrace);
        }
      });
    }

    public void Debug(Action<object> callback, Action<object> error)
    {
      Task.Run(() =>
      {
        try
        {
          UEObject.Reset();
          var result = new List<string>();
          if (_owningWorld == null)
          {
            callback(result.ToArray());
            return;
          }
          var visited = new List<IntPtr>();
          var worldFieldNames = _owningWorld.GetFieldNames(_owningWorld.ClassAddr, visited, "");
          result.Add("OWNING WORLD FIELD NAMES");
          foreach (var field in worldFieldNames)
          {
            result.Add(" " + field);
          }

          result.Add("");
          var owningGameInstance = _owningWorld["OwningGameInstance"];
          var localPlayers = owningGameInstance["LocalPlayers"];
          var localPlayer = localPlayers[0];
          var localPlayerFieldNames = localPlayer.GetFieldNames(localPlayer.ClassAddr, visited, ""); ;
          result.Add("LOCAL PLAYER FIELD NAMES");
          foreach (var field in localPlayerFieldNames)
          {
            result.Add(" " + field);
          }

          for (var l = 0; l < _levels.Num; l++)
          {
            var level = _levels[l];
            var actorsAddress = level.Address + (l == 0 ? 0xA8 : 0x98);
            var actors = new UEObject(actorsAddress);
            var actorsNum = actors.Num;
            if (actorsNum < 65536)
            {
              for (var i = 0; i < actorsNum; i++)
              {
                var actor = actors[i];
                var name = actor.GetName();
                /*if (visited.Contains(actor.ClassAddr))
                {
                  continue;
                }*/
             
                visited = new List<IntPtr>();
                var actorFieldNames = actor.GetFieldNames(actor.ClassAddr, visited, ""); ;
                result.Add("");

                result.Add("ACTOR " + name + " FIELD NAMES");
                foreach (var field in actorFieldNames)
                {
                  result.Add("  " + field);
                }
              }

            }
          }
          callback(result.ToArray());
        }
        catch (Exception e)
        {
          error(e.Message + "\n" + e.StackTrace);
        }
      });
    }
  }
}

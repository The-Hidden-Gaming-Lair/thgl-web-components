using System.Diagnostics;
using System;
using System.Collections.Generic;
using GameEventsPlugin.Models;
using GameEventsPlugin.Actions;
using System.Threading.Tasks;
using System.Linq;

namespace GameEventsPlugin
{
  public class Overwolf
  {
    Process _process = null;
    UEObject _owningWorld = null;
    UEObject _levels = null;

    public void GetPlayer(Action<object> callback, Action<object> error, string processName = null)
    {
      Task.Run(() =>
      {
        try
        {
          if (_process == null || _process.HasExited)
          {
            _owningWorld = null;
            if (processName != null)
            {
              var processes = Process.GetProcessesByName(processName);
              if (processes.Count() == 0)
              {
                throw new Exception("Can not find process");
              }
              _process = processes[0];
              if (_process == null || _process.HasExited)
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
              if (_process == null || _process.HasExited)
              {
                throw new Exception("Can not find UnrealWindow");
              }
            }

            var unrealEngine = new UnrealEngine(new Memory(_process));
            unrealEngine.UpdateAddresses();
          }

          var address = UnrealEngine.Memory.ReadProcessMemory<IntPtr>(UnrealEngine.GWorldPtr);
          var owningWorld = new UEObject(address);
          if (owningWorld == null)
          {
            UEObject.Reset();
            var unrealEngine = new UnrealEngine(new Memory(_process));
            unrealEngine.UpdateAddresses();
            throw new Exception("Can not find owning world");
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

          var owningGameInstance = _owningWorld["OwningGameInstance"];
          var player = Actors.GetActorPlayer(owningGameInstance);
          if (player != null)
          {
            callback(player);
          }
          else
          {
            error("Can not find player");
          }

        }
        catch (Exception e)
        {
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
          UEObject.Reset();
          var actors = Actors.GetActors(_levels, types);
          callback(actors.ToArray());
        }
        catch (Exception e)
        {
          error(e.Message + "\n" + e.StackTrace);
        }
      });
    }
  }
}

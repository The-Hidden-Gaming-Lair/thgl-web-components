using System.Diagnostics;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.Linq;
using System.Security.Principal;
using GameEventsPlugin.Models;
using System.IO;
using static GameEventsPlugin.Extensions;

namespace GameEventsPlugin
{
  public class Overwolf
  {
    Process _process = null;
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
        if (!IsElevated)
        {
          throw new Exception("Please run as administrator");
        }
        if (_process != null && _process.HasExited)
        {
          _memory = null;
          _process = null;
          throw new Exception("Process has exited");
        }
        if (_memory == null || _process == null)
        {
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
          Console.WriteLine("New Memory");
          _memory = new Memory(_process);
        }

        _lastError = null;

        callback(true);
      }
      catch (Exception e)
      {
        _lastError = e.Message;
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
          if (_process == null || _memory == null)
          {
            error("Can not find proc");
            return;
          }
          var scene = _memory.ReadProcessMemory<IntPtr>(_process.MainModule.BaseAddress + 0x5e740d0);
          if (scene == IntPtr.Zero)
          {
            error("Can not find scene");
            return;
          }
          var playerAddress = scene + 0x1860;
          var playerPos = _memory.ReadProcessMemory<Vector3>(playerAddress);
          if (playerPos.x != 0)
          {
            new Actor()
            {
              address = playerAddress.ToInt64(),
              type = "player",
              x = playerPos.x,
              y = playerPos.y,
              z = playerPos.z,
              r = 0,
            };
            callback(playerPos);
          }
          else
          {
            error(null);
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
          callback(noActors.ToArray());
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
        }
        catch (Exception e)
        {
          error(e.Message + "\n" + e.StackTrace);
        }
      });
    }

  }
}

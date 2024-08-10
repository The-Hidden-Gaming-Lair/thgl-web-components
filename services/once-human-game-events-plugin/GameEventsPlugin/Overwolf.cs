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
    internal ulong Offset;
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
          if (Offset == 0)
          {
            var addr = (ulong)_memory.FindPattern("E8 ? ? ? ? 45 33 C0 48 8D 54 24 ? 48 8B C8 E8 ? ? ? ? 48");
            var callFunc = _memory.ReadProcessMemory<uint>((IntPtr)((ulong)addr + 1)) + addr + 5;
            Offset = (_memory.ReadProcessMemory<uint>((IntPtr)(callFunc + 0x29 + 3)) + callFunc + 0x29 + 3 + 4 - (ulong)_memory.BaseAddress + 0x10);
          }
          var scene = _memory.ReadProcessMemory<IntPtr>((IntPtr)((ulong)_process.MainModule.BaseAddress + Offset));
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
              x = playerPos.z,
              y = playerPos.x,
              z = playerPos.y,
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

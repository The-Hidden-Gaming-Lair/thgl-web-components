using System.Diagnostics;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.Linq;
using System.Security.Principal;
using System.Reflection.Emit;

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
    public struct Vector3 { 
      public float x;    
      public float y;    
      public float z;    
    }
    public void GetPlayer(Action<Vector3> callback, Action<string> error)
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
            throw new Exception("Can not find proc");
          }
          var scene = _memory.ReadProcessMemory<IntPtr>(_process.MainModule.BaseAddress + 0x5E73F70);
          if (scene == IntPtr.Zero)
          {
            throw new Exception("Can not find scene");
          }
          var playerPos = _memory.ReadProcessMemory<Vector3>(scene + 0x1860);
          if (playerPos.x != 0)
          {
            callback(playerPos);
          }
          else
          {
            error("no player found");
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

using System.Diagnostics;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.Linq;
using System.Security.Principal;
using GameEventsPlugin.Models;
using System.IO;
using System.Numerics;
using System.Runtime.InteropServices;
using System.Globalization;

namespace GameEventsPlugin
{
  public class Overwolf
  {
    string _lastError = null;
    int status = -1;

    bool IsElevated
    {
      get
      {
        return WindowsIdentity.GetCurrent().Owner
          .IsWellKnown(WellKnownSidType.BuiltinAdministratorsSid);
      }
    }
    [DllImport("NativeGameEvents.dll")] extern static int UpdateProcess();
    public void UpdateProcess(Action<object> callback, Action<object> error, string processName = null)
    {
      try
      {
        if (!IsElevated)
        {
          throw new Exception("Please run as administrator");
        }
        status = UpdateProcess();
        if (status != 0)
        {
          _lastError = "UpdateProcess failed: " + status;
          error(_lastError);
        }
        else
        {
          _lastError = null;

          callback(true);
        }
      }
      catch (Exception e)
      {
        _lastError = e.Message;
        error(e.Message);
      }
    }
    [DllImport("NativeGameEvents.dll")] extern static IntPtr GetPlayer();
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
          if (status != 0)
          {
            error(_lastError);
            return;
          }
          var a = GetPlayer();
          if (a != IntPtr.Zero)
          {
            var csv = Marshal.PtrToStringAnsi(a).Split('|');
            Marshal.FreeHGlobal(a);
            var actor = new Actor()
            {
              address = long.Parse(csv[0], CultureInfo.InvariantCulture),
              type = csv[1],
              x = float.Parse(csv[2], CultureInfo.InvariantCulture),
              y = float.Parse(csv[3], CultureInfo.InvariantCulture),
              z = 0,
              r = null
            };
            callback(actor);
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

    [DllImport("NativeGameEvents.dll")] extern static IntPtr GetActors();
    public void GetActors(string[] types, Action<object> callback, Action<object> error)
    {
      Task.Run(() =>
      {
        try
        {
          if (status != 0)
          {
            error(_lastError);
            return;
          }
          var actorsPtr = GetActors();
          if (actorsPtr != IntPtr.Zero)
          {
            var csv = Marshal.PtrToStringAnsi(actorsPtr).Split('\n');
            Marshal.FreeHGlobal(actorsPtr);
            var actors = csv.Select(c =>
            {
              var items = c.Split('|');
              return new Actor
              {
                address = long.Parse(items[0], CultureInfo.InvariantCulture),
                type = items[1],
                x = float.Parse(items[2], CultureInfo.InvariantCulture),
                y = float.Parse(items[3], CultureInfo.InvariantCulture),
                z = 0,
                r = null
              };
            });
            // Remove duplicates by type and x,y
            actors = actors.GroupBy(a => new { a.type, a.x, a.y }).Select(g => g.First());

            callback(actors.ToArray());
          }
          else
          {
            callback(null);
          }
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

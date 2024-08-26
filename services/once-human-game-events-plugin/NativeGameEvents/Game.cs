using System.Diagnostics;
using System.Globalization;
using System.Numerics;
using System.Reflection;
using System.Runtime.InteropServices;
using System.Security.Principal;
using System.Text;
using System.Text.Json.Nodes;
using NativeGameEvents.Models;

namespace NativeGameEvents
{
  internal static class Game
  {
    internal static Memory _memory = null;
    internal static string _lastError = null;
    internal static nint BaseAddress = 0;
    internal static nint SceneOffset = 0;
    internal static bool IsElevated
    {
      get
      {
        return WindowsIdentity.GetCurrent().Owner
          .IsWellKnown(WellKnownSidType.BuiltinAdministratorsSid);
      }
    }
    [UnmanagedCallersOnly(EntryPoint = "UpdateProcess")]
    internal static int UpdateProcess()
    {
      try
      {
        if (!System.Environment.ProcessPath.Contains("GEPConsole") && !System.Environment.ProcessPath.Contains("Once Human Map"))
        {
          return -1;
        }
        if (_memory != null && _memory.Process?.HasExited == true)
        {
          var exitCode = _memory.Process?.ExitCode;
          var returnCode = 2000;
          if (exitCode != null)
          {
            returnCode = (int)(2000 + exitCode);
          }
          _memory = null;
          return returnCode;
          throw new Exception("Process has exited");

        }
        if (_memory == null)
        {
          _memory = new Memory();
          if (_memory.Process == null || _memory.Process?.HasExited == true)
          {
            _memory = null;
            return 3;
          }
          if (SceneOffset == 0)
          {
            var addr = _memory.FindPattern(new byte[] { 0xE8, 0, 0, 0, 0, 0x45, 0x33, 0xC0, 0x48, 0x8D, 0x54, 0x24, 0x0, 0x48, 0x8B, 0xC8, 0xE8, 0, 0, 0, 0, 0x48 });
            //var addr = _memory.FindPattern("E8 ? ? ? ? 45 33 C0 48 8D 54 24 ? 48 8B C8 E8 ? ? ? ? 48");
            var callFunc = _memory.ReadProcessMemory<int>(addr + 1) + addr + 5;
            SceneOffset = _memory.ReadProcessMemory<int>(callFunc + 0x29 + 3) + callFunc + 0x29 + 3 + 4 - _memory.BaseAddress + 0x10;
          }
        }
      }
      catch (Exception e)
      {
        //Console.WriteLine(e.Message);
        return 5;
        //error(e.Message);
      }
      return 0;
    }
    [UnmanagedCallersOnly(EntryPoint = "GetPlayer")]
    internal static nint GetPlayer()
    {
      //Task.Run(static () =>
      {
        try
        {
          if (_lastError != null)
          {
            //error(_lastError);
            return 0;
          }
          if (_memory == null)
          {
            //error("Can not find proc");
            return 0;
          }
          var scene = _memory.ReadProcessMemory<nint>(_memory.BaseAddress + SceneOffset);
          if (scene == IntPtr.Zero)
          {
            //error("Can not find scene");
            return 0;
          }
          var playerAddress = scene + playerOffset;
          var playerPos = _memory.ReadProcessMemory<Vector3>(playerAddress);
          if (playerPos.X != 0)
          {
            var actor = new Actor()
            {
              address = playerAddress.GetHashCode(),
              type = "player",
              x = playerPos.Z,
              y = playerPos.X
            };
            //Console.WriteLine(actor.ToString());
            return Marshal.StringToCoTaskMemUTF8(actor.ToString());
          }
          else
          {
            //error(null);
          }
        }
        catch (Exception e)
        {
          //Console.WriteLine(e.Message);
          //error(e.Message + "\n" + e.StackTrace);
        }
        return 0;
      }//);
    }

    //internal static Dictionary<nint, string> stringCache = new Dictionary<nint, string> { };
    internal const int objCount = 0x10000;
    internal static int modelMgrOffset = int.Parse("0xf88".Replace("0x", ""), System.Globalization.NumberStyles.HexNumber);
    internal static int locOffset = int.Parse("0x174".Replace("0x", ""), System.Globalization.NumberStyles.HexNumber);
    internal static int nameOffset = int.Parse("0x5d8".Replace("0x", ""), System.Globalization.NumberStyles.HexNumber);
    internal static int playerOffset = int.Parse("0x1848".Replace("0x", ""), System.Globalization.NumberStyles.HexNumber);
    //internal static int playerOffset = int.Parse("0xf38".Replace("0x", ""), System.Globalization.NumberStyles.HexNumber);
    [UnmanagedCallersOnly(EntryPoint = "GetActors")]
    internal static nint GetActors()
    {
      //Task.Run(() =>
      {
        if (_memory == null)
        {
          //error("Can not find proc");
          return 0;
        }
        try
        {
          var actors = new List<Actor>();
          var scene = _memory.ReadProcessMemory<nint>(_memory.BaseAddress + SceneOffset);
          if (scene == 0) return 0;
          var modelMgr = _memory.ReadProcessMemory<nint>(scene + modelMgrOffset);
          if (modelMgr == 0) return 0;
          var modelMgrBlock = _memory.ReadProcessMemory(modelMgr, objCount * 8);
          var maxDist = 0f;
          var count = int.Parse(objCount.ToString(), CultureInfo.InvariantCulture);
          for (var i = 0; i < count; i++)
          {
            var model = (nint)BitConverter.ToUInt64(modelMgrBlock, i * 8);
            //if (ignoreCache.ContainsKey(model)) continue;
            var pos = _memory.ReadProcessMemory<Vector3>(model + locOffset);
            if (pos.X == 0) continue;
            //var sharedStrPtr = mem.ReadProcessMemory<nint>(model + 0x58);
            var sharedStrPtr = _memory.ReadProcessMemory<nint>(model + nameOffset);
            //if (!stringCache.TryGetValue(sharedStrPtr, out string? str))
            //{
            var strPtr = _memory.ReadProcessMemory<nint>(sharedStrPtr + 8);
            var str = _memory.ReadProcessMemory<string>(strPtr);
            //stringCache[sharedStrPtr] = str;
            // }
            if (!str.StartsWith("character\\monster") &&
              !str.StartsWith("character\\animal") &&
              !str.StartsWith("character\\boss") &&
              !str.StartsWith("environment\\dynamic_objects\\interaction\\spacetime\\invisible_treasure_") &&
              !str.StartsWith("environment\\static_objects\\common\\prop\\box"))
            {
              continue;
            }
            //if (
            //                //str.StartsWith(@"environment\static_objects") ||
            //                //str.StartsWith(@"environment/static_objects") ||
            //                //str.StartsWith(@"environment\dynamic_objects") ||
            //                //str.StartsWith(@"environment/dynamic_objects") ||
            //                str.StartsWith(@"environment\decals") ||
            //                str.StartsWith(@"environment/decals") ||
            //                str.StartsWith(@"environment\ecosystem\decal") ||
            //                str.StartsWith(@"environment\volume_decal") ||
            //                str.StartsWith(@"volume_decal") ||
            //                str.StartsWith(@"environment/volume_decal") ||
            //                str.StartsWith(@"environment\prefab") ||
            //                str.StartsWith(@"environment/prefab") ||
            //                str.StartsWith(@"environment\collection") ||
            //                str.StartsWith(@"environment\dark_cirrus") ||
            //                str.StartsWith(@"environment\ecosystem\rock") ||
            //                str.StartsWith(@"environment\ecosystem\tree") ||
            //                str.StartsWith(@"environment\ecosystem\grass") ||
            //                str.StartsWith(@"environment\ecosystem\ivy") ||
            //                str.StartsWith(@"environment\ecosystem\bush") ||
            //                str.StartsWith(@"environment\procedure_element") ||
            //                str.StartsWith(@"environment\procedura_element") ||
            //                str.StartsWith(@"environment\test") ||
            //                str.StartsWith(@"environment\temp") ||
            //                str.StartsWith(@"character\empty") ||
            //                str.StartsWith(@"character\player") ||
            //                str.StartsWith(@"character/player") ||
            //                str.StartsWith(@"character\weapon") ||
            //                str.StartsWith(@"character/weapon") ||
            //                str.StartsWith(@"material") ||
            //                str.StartsWith(@"der") ||
            //                str.StartsWith(@"ui") ||
            //                str.StartsWith(@"nt") ||
            //                str.StartsWith(@"ai_move_anim") ||
            //                str.StartsWith(@"node") ||
            //                str.StartsWith(@"VVGI") ||
            //                str.StartsWith(@"Particle") ||
            //                str.StartsWith(@"<") ||
            //                str.StartsWith(@"@") ||
            //                str.StartsWith(@"__") ||
            //                !(str.Contains("/") || str.Contains("\\")) ||
            //                str.StartsWith(@"scene") ||
            //                str.StartsWith(@"cene") ||
            //                str.StartsWith("common") ||
            //                str.StartsWith("effect") ||
            //                str.StartsWith("shader") ||
            //                str == "null" ||
            //                string.IsNullOrEmpty(str)
            //                )
            //{
            //  continue;
            //}
            var type = str.Split("\\").Last();
            if (actors.Find(a => a.type == type && a.x== pos.Z && a.y == pos.X) != null)
            {
              // Skip duplicates
              continue;
            }
            actors.Add(new Actor
            {
              address = model.GetHashCode(),
              type = type,
              x = pos.Z,
              y = pos.X,
            });
          }
          var csv = string.Join("\n", actors.DistinctBy(a => a).Select(a => a.ToString()));
          return Marshal.StringToCoTaskMemUTF8(csv);
          //callback(actors.ToArray());
        }
        catch (Exception e)
        {
          //Console.WriteLine(e.Message);
          //error(e.Message + "\n" + e.StackTrace);
        }
      }//);
      return 0;
    }
  }
}

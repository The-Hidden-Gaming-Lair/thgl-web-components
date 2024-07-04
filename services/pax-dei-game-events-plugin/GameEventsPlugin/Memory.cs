using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.InteropServices;
using System.Text;

namespace GameEventsPlugin
{
  public class Memory
  {
    [DllImport("user32")]
    public static extern IntPtr FindWindowEx(IntPtr hwndParent, IntPtr hwndChildAfter, string lpszClass, string lpszWindow);

    [DllImport("user32")]
    public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out int lpdwProcessId);

    public ProcessSummary Process { get; }

    public IntPtr BaseAddress => Process.MainModuleBase;


    public int MaxStringLength = 0x100;

    public Memory(ProcessSummary process)
    {
      Process = process;
    }

    public byte[] ReadProcessMemory(long addr, int length)
    {
      return Mem.Instance.ReadProcessBytes(Process.ProcessId, (IntPtr)addr, length);
    }

    public object ReadProcessMemory(Type type, IntPtr addr)
    {
      if (type == typeof(string))
      {
        var stringLength = MaxStringLength;
        var bytes = new List<byte>();
        var isUtf16 = false;
        for (var i = 0; i < 64; i++)
        {
          var letters8 = ReadProcessMemory<Int64>(addr + i * 8);
          var tempBytes = BitConverter.GetBytes(letters8);
          for (var j = 0; j < 8 && stringLength > 0; j++)
          {
            if (tempBytes[j] == 0 && j == 1 && bytes.Count == 1)
              isUtf16 = true;
            if (isUtf16 && j % 2 == 1)
              continue;
            if (tempBytes[j] == 0)
              return Encoding.UTF8.GetString(bytes.ToArray());
            if ((tempBytes[j] < 32 || tempBytes[j] > 126) && tempBytes[j] != '\n')
              return "null";
            bytes.Add(tempBytes[j]);
            stringLength--;
          }
        }

        return Encoding.UTF8.GetString(bytes.ToArray());
      }

      var buffer = Mem.Instance.ReadProcessBytes(Process.ProcessId, (IntPtr) addr, Marshal.SizeOf(type));
      var structPtr = GCHandle.Alloc(buffer, GCHandleType.Pinned);
      var obj = Marshal.PtrToStructure(structPtr.AddrOfPinnedObject(), type);

      structPtr.Free();
      return obj;
    }

    public T ReadProcessMemory<T>(IntPtr addr)
    {
      return (T)ReadProcessMemory(typeof(T), addr);
    }


    public IntPtr FindPattern(string pattern)
    {
      return FindPattern(pattern, Process.MainModuleBase, Process.MainModuleImageSize);
    }

    public IntPtr FindStringRef(string str)
    {
      var stringAddr = FindPattern(BitConverter.ToString(Encoding.Unicode.GetBytes(str)).Replace("-", " "));
      var sigScan = new SigScan(Process, Process.MainModuleBase, (int)Process.MainModuleImageSize);
      sigScan.DumpMemory();
      for (var i = 0; i < sigScan.Size; i++)
      {
        if ((sigScan.m_vDumpedRegion[i] != 0x48 && sigScan.m_vDumpedRegion[i] != 0x4c) || sigScan.m_vDumpedRegion[i + 1] != 0x8d) continue;
        var jmpTo = BitConverter.ToInt32(sigScan.m_vDumpedRegion, i + 3);
        var addr = sigScan.Address + i + jmpTo + 7;
        if (addr == stringAddr)
        {
          return Process.MainModuleBase + i;
        }
      }

      return (IntPtr)0;
    }

    public IntPtr FindPattern(string pattern, IntPtr start, ulong length)
    {
      //var skip = pattern.ToLower().Contains("cc") ? 0xcc : pattern.ToLower().Contains("aa") ? 0xaa : 0;
      var sigScan = new SigScan(Process, start, (int)length);
      var arrayOfBytes = pattern.Split(' ').Select(b => b.Contains("?") ? (byte)0 : (byte)Convert.ToInt32(b, 16)).ToArray();
      var strMask = string.Join("", pattern.Split(' ').Select(b => b.Contains("?") ? '?' : 'x'));
      return sigScan.FindPattern(arrayOfBytes, strMask, 0);
    }
  }
}
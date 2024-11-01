using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Reflection;
using System.Runtime.InteropServices;
using System.Text;

namespace GameEventsPlugin
{
  public unsafe class Memory
  {

    [DllImport("kernel32")] static extern IntPtr OpenProcess(UInt32 dwDesiredAccess, Int32 bInheritHandle, Int32 dwProcessId);
    [DllImport("kernel32")] static extern Int32 ReadProcessMemory(IntPtr hProcess, Int64 lpBaseAddress, [In, Out] Byte[] buffer, Int32 size, out Int32 lpNumberOfBytesRead);
    [DllImport("user32")] public static extern IntPtr FindWindowEx(IntPtr hwndParent, IntPtr hwndChildAfter, String lpszClass, String lpszWindow);
    [DllImport("user32")] public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out Int32 lpdwProcessId);

    public IntPtr procHandle = IntPtr.Zero;
    public Process Process { get; private set; }
    public List<ProcessModule> Modules { get; private set; }

    public Memory(Process proc, string[] moduleNames)
    {
      ProcessModule targetModule = null;
      Modules = new List<ProcessModule>();
      if (moduleNames == null)
      {
        Modules.Add(proc.MainModule);
      }
      foreach (ProcessModule module in proc.Modules)
      {
        if (moduleNames.Contains(module.ModuleName))
        {
          Modules.Add(module);
        }
      }

      Process = proc;

      if (Process == null) return;
      OpenProcessById(Process.Id);
    }

    public void OpenProcessById(Int32 procId)
    {
      procHandle = OpenProcess(0x38, 1, procId);
    }
    public Int32 maxStringLength = 0x100;

    public Byte[] ReadProcessMemory(Int64 addr, Int32 length)
    {
      try
      {
        var maxSize = 0x64000;
        if (length >= maxSize)
        {
          return new Byte[0];
        }
        var buffer = new Byte[length];
        for (var i = 0; i < length / (Single)maxSize; i++)
        {
          var buf = new Byte[0x64000];
          var blockSize = (i == (length / maxSize)) ? length : i % maxSize;
          ReadProcessMemory(procHandle, addr + i * maxSize, buf, blockSize, out Int32 bytesRead);
          Array.Copy(buf, 0, buffer, i * maxSize, blockSize);
        }
        return buffer;
      }
      catch (Exception ex)
      {
        Console.WriteLine(ex.ToString());
        return new Byte[0];
      }
    }
    public unsafe Object ReadProcessMemory(Type type, Int64 addr)
    {
      if (type == typeof(String))
      {
        var stringLength = maxStringLength;
        List<Byte> bytes = new List<Byte>();
        var isUtf16 = false;
        for (var i = 0; i < 64; i++)
        {
          var letters8 = ReadProcessMemory<Int64>((IntPtr)addr + i * 8);
          var tempBytes = BitConverter.GetBytes(letters8);
          for (int j = 0; j < 8 && stringLength > 0; j++)
          {
            if (tempBytes[j] == 0 && j == 1 && bytes.Count == 1)
              isUtf16 = true;
            if (isUtf16 && j % 2 == 1)
              continue;
            if (tempBytes[j] == 0)
              return (Object)Encoding.UTF8.GetString(bytes.ToArray());
            if ((tempBytes[j] < 32 || tempBytes[j] > 126) && tempBytes[j] != '\n')
              return (Object)"null";
            bytes.Add(tempBytes[j]);
            stringLength--;
          }
        }
        return (Object)Encoding.UTF8.GetString(bytes.ToArray());
      }
      var buffer = new Byte[Marshal.SizeOf(type)];
      ReadProcessMemory(procHandle, addr, buffer, Marshal.SizeOf(type), out Int32 bytesRead);
      var structPtr = GCHandle.Alloc(buffer, GCHandleType.Pinned);
      var obj = Marshal.PtrToStructure(structPtr.AddrOfPinnedObject(), type);
      var members = obj.GetType().GetFields();
      structPtr.Free();
      return obj;
    }
    public T ReadProcessMemory<T>(IntPtr addr)
    {
      return (T)ReadProcessMemory(typeof(T), addr.ToInt64());
    }

    public IntPtr FindPattern(String pattern)
    {
      foreach (ProcessModule module in Modules)
      {
        //Console.WriteLine($"Module: {module.ModuleName}");
        var res = FindPattern(pattern, module.BaseAddress, module.ModuleMemorySize);
        if (res != IntPtr.Zero)
        {
          Console.WriteLine($"  Found at: {res} with module {module.ModuleName}");
          return res;
        }
      }
      return IntPtr.Zero;
    }
    public IntPtr FindStringRef(String str)
    {
      var stringAddr = FindPattern(BitConverter.ToString(Encoding.Unicode.GetBytes(str)).Replace("-", " "));

      foreach (ProcessModule module in Modules)
      {
        var sigScan = new SigScan(Process, module.BaseAddress, module.ModuleMemorySize);
        sigScan.DumpMemory();
        for (var i = 0; i < sigScan.Size; i++)
        {
          if ((sigScan.m_vDumpedRegion[i] == 0x48 || sigScan.m_vDumpedRegion[i] == 0x4c) && sigScan.m_vDumpedRegion[i + 1] == 0x8d)
          {
            var jmpTo = BitConverter.ToInt32(sigScan.m_vDumpedRegion, i + 3);
            var addr = sigScan.Address + i + jmpTo + 7;
            if (addr == stringAddr)
            {
              return module.BaseAddress + i;
            }
          }
        }
      }
      return IntPtr.Zero;
    }
    public IntPtr FindPattern(String pattern, IntPtr start, Int32 length)
    {
      var sigScan = new SigScan(Process, start, length);
      var arrayOfBytes = pattern.Split(' ').Select(b => b.Contains("?") ? (Byte)0 : (Byte)Convert.ToInt32(b, 16)).ToArray();
      var strMask = String.Join("", pattern.Split(' ').Select(b => b.Contains("?") ? '?' : 'x'));
      return sigScan.FindPattern(arrayOfBytes, strMask, 0);
    }
  }
}
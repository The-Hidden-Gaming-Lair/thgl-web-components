using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
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
    public IntPtr BaseAddress = IntPtr.Zero;
    public int ModuleMemorySize = 0;

    public Memory(Process proc)
    {
      //r result = NtOpenProcess(ref hProcess, 0x001F0FFF, ref oa, ref ci);
      //var handle = NativeLibrary.Load("kernel32.dll");
      //ReadProcMemInternal = (delegate* unmanaged[Stdcall]<IntPtr, UInt64, Byte[], Int32, out Int32, Int32>)NativeLibrary.GetExport(handle, "ReadProcessMemory");
      Process = proc;
      if (Process == null) return;
      OpenProcessById(Process.Id);
      BaseAddress = Process.MainModule.BaseAddress;
      ModuleMemorySize = Process.MainModule.ModuleMemorySize;
    }

    public void OpenProcessById(Int32 procId)
    {
      procHandle = OpenProcess(0x38, 1, procId);
    }
    public Int32 maxStringLength = 0x100;

    private const int MaxReadSize = 0x1000;

    public Byte[] ReadProcessMemory(Int64 addr, Int32 length)
    {
      var buffer = new Byte[length];
      for (var i = 0; i < length / (Single)MaxReadSize; i++)
      {
        var blockSize = (i == (length / MaxReadSize)) ? length % MaxReadSize : MaxReadSize;
        var buf = new Byte[blockSize];
        ReadProcessMemory(procHandle, addr + i * MaxReadSize, buf, blockSize, out Int32 bytesRead);
        Array.Copy(buf, 0, buffer, i * MaxReadSize, blockSize);
      }

      return buffer;
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
      structPtr.Free();
      return obj;
    }
    public T ReadProcessMemory<T>(IntPtr addr)
    {
      return (T)ReadProcessMemory(typeof(T), addr.ToInt64());
    }
  }
}
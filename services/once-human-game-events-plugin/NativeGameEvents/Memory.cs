using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Numerics;
using System.Runtime.InteropServices;
using System.Text;

namespace NativeGameEvents
{
    public unsafe class Memory
    {
        [DllImport("kernel32")] internal static extern Int32 ReadProcessMemory(IntPtr hProcess, Int64 lpBaseAddress, [In, Out] Byte[] buffer, Int32 size, out Int32 lpNumberOfBytesRead);
        //public static delegate* unmanaged[Stdcall]<IntPtr, Int64, Byte[], Int32, out Int32, Int32> ReadProcMemInternal;
        public IntPtr procHandle = IntPtr.Zero;
        internal NativeProcess Process { get; private set; }
        public IntPtr BaseAddress = IntPtr.Zero;
        public int ModuleMemorySize = 0;

        public Memory()
        {

            //r result = NtOpenProcess(ref hProcess, 0x001F0FFF, ref oa, ref ci);
            //var handle = NativeLibrary.Load("kernel32.dll");
            //ReadProcMemInternal = (delegate* unmanaged[Stdcall]<IntPtr, Int64, Byte[], Int32, out Int32, Int32>)NativeLibrary.GetExport(handle, "ReadProcessMemory");
            //OpenProcessInternal = (delegate* unmanaged[Stdcall]<UInt32, Int32, Int32, IntPtr>)NativeLibrary.GetExport(handle, "OpenProcess");
            //Process = Process.GetProcessesByName("ONCE_HUMAN").FirstOrDefault();
            Process = NativeProcess.GetProcessByName("ONCE_HUMAN.exe");
            if (Process == null) return;
            //OpenProcessById(Process.Id);
            procHandle = Process.Handle;
            BaseAddress = Process.BaseAddress;
            ModuleMemorySize = Process.ModuleMemorySize;
        }
        public Int32 maxStringLength = 0x100;

        private const int MaxReadSize = 0x10000;

        public Byte[] ReadProcessMemory(Int64 addr, Int32 length)
        {
            var buffer = new Byte[length];
            for (var i = 0; i < length / MaxReadSize; i++)
            {
                var blockSize = (i == (length / MaxReadSize)) ? length % MaxReadSize : MaxReadSize;
                var buf = new Byte[blockSize];
                //ReadProcessMemory(procHandle, addr + i * MaxReadSize, buf, blockSize, out Int32 bytesRead);
                ReadProcessMemory(procHandle, addr + i * MaxReadSize, buf, blockSize, out Int32 bytesRead);
                Array.Copy(buf, 0, buffer, i * MaxReadSize, blockSize);
            }

            return buffer;
        }
        public unsafe Object ReadProcessMemory(Type type, nint addr)
        {
            if (type == typeof(String))
            {
                var stringLength = maxStringLength;
                List<Byte> bytes = new List<Byte>();
                var isUtf16 = false;
                for (var i = 0; i < 64; i++)
                {
                    var letters8 = ReadProcessMemory<nint>(addr + i * 8);
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
            var size = 0;
            if (type == typeof(int)) size = 4;
            else if (type == typeof(uint)) size = 4;
            else if (type == typeof(ulong)) size = 8;
            else if (type == typeof(nint)) size = 8;
            else if (type == typeof(Vector3)) size = 12;
            else throw new Exception("bad size AOT");
            var buffer = new Byte[size];
            ReadProcessMemory(procHandle, addr, buffer, size, out Int32 bytesRead);
            //ReadProcMemInternal(procHandle, addr, buffer, size, out Int32 bytesRead);
            var structPtr = GCHandle.Alloc(buffer, GCHandleType.Pinned);
            var obj = (type == typeof(int)) ? (object)Marshal.PtrToStructure<int>(structPtr.AddrOfPinnedObject()) : (type == typeof(Vector3)) ? (object)Marshal.PtrToStructure<Vector3>(structPtr.AddrOfPinnedObject()) : (type == typeof(uint)) ? (object)Marshal.PtrToStructure<uint>(structPtr.AddrOfPinnedObject()) : (object)Marshal.PtrToStructure<nint>(structPtr.AddrOfPinnedObject());
            structPtr.Free();
            return obj;
        }
        public T ReadProcessMemory<T>(nint addr)
        {
            return (T)ReadProcessMemory(typeof(T), addr);
        }
        public IntPtr FindPattern(byte[] pattern, nint addr = 0, int size = 0)
        {
            if (addr == 0) addr = BaseAddress;
            if (size == 0) size = ModuleMemorySize;
            var sigScan = new SigScan(Process, addr, size);
            var strMask = String.Join("", pattern.Select(b => b == 0 ? '?' : 'x'));
            return sigScan.FindPattern(pattern, strMask, 0);
        }
    }
}
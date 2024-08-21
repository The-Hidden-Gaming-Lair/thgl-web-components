using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Reflection;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading.Tasks;

namespace NativeGameEvents
{
    public class NativeProcess
    {
        internal nint Handle;
        internal nint BaseAddress;
        internal int ModuleMemorySize;

        [StructLayout(LayoutKind.Sequential)]
        public struct MODULEINFO
        {
            public IntPtr lpBaseOfDll;
            public uint SizeOfImage;
            public IntPtr EntryPoint;
        }
        [StructLayout(LayoutKind.Sequential)]
        public struct PROCESSENTRY32
        {
            public uint dwSize;
            public uint cntUsage;
            public uint th32ProcessID;
            public IntPtr th32DefaultHeapID;
            public uint th32ModuleID;
            public uint cntThreads;
            public uint th32ParentProcessID;
            public int pcPriClassBase;
            public uint dwFlags;
            [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 260)]
            public string szExeFile;
        }
        [StructLayout(LayoutKind.Sequential)]
        public struct MODULEENTRY32
        {
            public uint dwSize;
            public uint th32ModuleID;
            public uint th32ProcessID;
            public uint GlblcntUsage;
            public uint ProccntUsage;
            public IntPtr modBaseAddr;
            public uint modBaseSize;
            public IntPtr hModule;
            [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 256)]
            public string szModule;
            [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 260)]
            public string szExePath;
        }

        public delegate IntPtr CreateToolhelp32SnapshotDelegate(uint dwFlags, uint th32ProcessID);
        public delegate bool Module32FirstDelegate(IntPtr hSnapshot, ref MODULEENTRY32 lpme);
        public delegate bool Module32NextDelegate(IntPtr hSnapshot, ref MODULEENTRY32 lpme);
        public delegate bool Process32FirstDelegate(IntPtr hSnapshot, ref PROCESSENTRY32 lppe);
        public delegate bool Process32NextDelegate(IntPtr hSnapshot, ref PROCESSENTRY32 lppe);
        public delegate IntPtr OpenProcessDelegate(uint dwDesiredAccess, bool bInheritHandle, uint dwProcessId);
        public delegate bool CloseHandleDelegate(IntPtr hObject);

        // Declare delegate instances
        public static CreateToolhelp32SnapshotDelegate CreateToolhelp32Snapshot;
        public static Process32FirstDelegate Process32First;
        public static Process32NextDelegate Process32Next;
        public static Module32FirstDelegate Module32First;
        public static Module32NextDelegate Module32Next;
        public static OpenProcessDelegate OpenProcess;
        public static CloseHandleDelegate CloseHandle;

        public const uint TH32CS_SNAPPROCESS = 0x00000002;
        public const uint TH32CS_SNAPMODULE = 0x00000008;
        public const uint TH32CS_SNAPMODULE32 = 0x00000010;
        public const uint INVALID_HANDLE_VALUE = 0xFFFFFFFF;

        private static IntPtr _kernel32Handle;
        internal static NativeProcess GetProcessByName(string processName)
        {
            _kernel32Handle = NativeLibrary.Load("kernel32.dll");

            CreateToolhelp32Snapshot = Marshal.GetDelegateForFunctionPointer<CreateToolhelp32SnapshotDelegate>(
                NativeLibrary.GetExport(_kernel32Handle, "CreateToolhelp32Snapshot"));

            Process32First = Marshal.GetDelegateForFunctionPointer<Process32FirstDelegate>(
                NativeLibrary.GetExport(_kernel32Handle, "Process32First"));

            Process32Next = Marshal.GetDelegateForFunctionPointer<Process32NextDelegate>(
                NativeLibrary.GetExport(_kernel32Handle, "Process32Next"));

            Module32First = Marshal.GetDelegateForFunctionPointer<Module32FirstDelegate>(
                NativeLibrary.GetExport(_kernel32Handle, "Module32First"));

            Module32Next = Marshal.GetDelegateForFunctionPointer<Module32NextDelegate>(
                NativeLibrary.GetExport(_kernel32Handle, "Module32Next"));

            OpenProcess = Marshal.GetDelegateForFunctionPointer<OpenProcessDelegate>(
                NativeLibrary.GetExport(_kernel32Handle, "OpenProcess"));

            CloseHandle = Marshal.GetDelegateForFunctionPointer<CloseHandleDelegate>(
                NativeLibrary.GetExport(_kernel32Handle, "CloseHandle"));

            var id = GetProcessInfoByName(processName);
            var handle = OpenProcess(0x38, true, id.Item1);
            var np = new NativeProcess
            {
                Handle = handle,
                BaseAddress = id.Item2,
                ModuleMemorySize = (int)id.Item3
            };
            return np;
        }
        static (uint, nint, uint) GetProcessInfoByName(string processName)
        {
            IntPtr hSnapshot = CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0);

            if (hSnapshot == (IntPtr)INVALID_HANDLE_VALUE)
            {
                throw new SystemException("Unable to create snapshot of processes.");
            }

            PROCESSENTRY32 procEntry = new PROCESSENTRY32 { dwSize = (uint)Marshal.SizeOf(typeof(PROCESSENTRY32)) };

            if (Process32First(hSnapshot, ref procEntry))
            {
                do
                {
                    if (procEntry.szExeFile.Equals(processName, StringComparison.OrdinalIgnoreCase))
                    {

                        IntPtr hSnapshot2 = CreateToolhelp32Snapshot(TH32CS_SNAPMODULE | TH32CS_SNAPMODULE32, procEntry.th32ProcessID);
                        MODULEENTRY32 modEntry = new MODULEENTRY32 { dwSize = (uint)Marshal.SizeOf(typeof(MODULEENTRY32)) };

                        if (Module32First(hSnapshot2, ref modEntry))
                        {
                            do
                            {
                                if (modEntry.th32ProcessID == procEntry.th32ProcessID)
                                {
                                    CloseHandle(hSnapshot);
                                    CloseHandle(hSnapshot2);
                                    var baseAddr = modEntry.modBaseAddr;
                                    var size = modEntry.modBaseSize;
                                    return (procEntry.th32ProcessID, modEntry.modBaseAddr, modEntry.modBaseSize);
                                }
                            } while (Module32Next(hSnapshot2, ref modEntry));
                        }
                    }
                }
                while (Process32Next(hSnapshot, ref procEntry));
            }
            CloseHandle(hSnapshot);
            return (0, 0, 0); // Process not found
        }

        static IntPtr GetMainModuleBaseAddress(string processName)
        {
            foreach (var process in System.Diagnostics.Process.GetProcessesByName(processName))
            {
                IntPtr hSnapshot = CreateToolhelp32Snapshot(TH32CS_SNAPMODULE | TH32CS_SNAPMODULE32, (uint)process.Id);

                if (hSnapshot == (IntPtr)INVALID_HANDLE_VALUE)
                {
                    continue;
                }

                MODULEENTRY32 modEntry = new MODULEENTRY32 { dwSize = (uint)Marshal.SizeOf(typeof(MODULEENTRY32)) };

                if (Module32First(hSnapshot, ref modEntry))
                {
                    do
                    {
                        if (modEntry.th32ProcessID == process.Id)
                        {
                            CloseHandle(hSnapshot);
                            return modEntry.modBaseAddr;
                        }
                    } while (Module32Next(hSnapshot, ref modEntry));
                }

                CloseHandle(hSnapshot);
            }
            return IntPtr.Zero; // Process or module not found
        }
    }
}

using System.Runtime.InteropServices;
using UCheck.Lib.Utility;

namespace UCheck.Lib;

public class DriverInterface(string registryPath)
{
    public static bool IsDriverOpen(string driverPath)
    {
        var handle = WinApi.CreateFileA(driverPath, FileAccess.ReadWrite, FileShare.ReadWrite, IntPtr.Zero, FileMode.Open, 0, IntPtr.Zero);
        var result = handle != WinApi.INVALID_HANDLE_VALUE;
        _ = WinApi.CloseHandle(handle);
        return result;
    }

    public bool HasValidHandle()
    {
        return _driverHandle != WinApi.INVALID_HANDLE_VALUE;
    }

    public bool CopyVirtualMemory(int targetProcessId, IntPtr targetAddress, IntPtr bufferAddress, int bufferSize)
    {
        var flag = _driverHandle != WinApi.INVALID_HANDLE_VALUE;
        bool flag2;
        if (flag)
        {
            var operation = new Operations.KERNEL_COPY_MEMORY_OPERATION
            {
                targetProcessId = targetProcessId,
                targetAddress = (ulong)targetAddress.ToInt64(),
                bufferAddress = (ulong)bufferAddress.ToInt64(),
                bufferSize = bufferSize
            };
            var operationPointer = MarshalUtility.CopyStructToMemory(operation);
            var result = WinApi.DeviceIoControl(_driverHandle, Operations.IO_COPY_MEMORY, operationPointer,
                Marshal.SizeOf<Operations.KERNEL_COPY_MEMORY_OPERATION>(), IntPtr.Zero, 0, IntPtr.Zero, IntPtr.Zero);
            Marshal.FreeHGlobal(operationPointer);
            flag2 = result;
        }
        else
        {
            flag2 = false;
        }

        return flag2;
    }

    public bool GetProcessSummaryList(out ProcessSummary[] result)
    {
        result = Array.Empty<ProcessSummary>();
        var flag = _driverHandle != WinApi.INVALID_HANDLE_VALUE;
        if (!flag) return false;
        var requiredBufferSize = GetProcessListRequiredBufferSize();
        var flag2 = requiredBufferSize > 0;
        if (!flag2) return false;
        var bufferPointer = MarshalUtility.AllocZeroFilled(requiredBufferSize);
        var operation = new Operations.KERNEL_PROCESS_LIST_OPERATION
        {
            bufferAddress = (ulong)bufferPointer.ToInt64(),
            bufferSize = requiredBufferSize
        };
        var operationPointer = MarshalUtility.CopyStructToMemory(operation);
        var operationSize = Marshal.SizeOf<Operations.KERNEL_PROCESS_LIST_OPERATION>();
        var flag3 = WinApi.DeviceIoControl(_driverHandle, Operations.IO_GET_PROCESS_LIST, operationPointer, operationSize, operationPointer,
            operationSize, IntPtr.Zero, IntPtr.Zero);
        if (!flag3) return false;
        operation = MarshalUtility.GetStructFromMemory<Operations.KERNEL_PROCESS_LIST_OPERATION>(operationPointer);
        var flag4 = operation.processCount > 0;
        if (!flag4) return false;
        var managedBuffer = new byte[requiredBufferSize];
        Marshal.Copy(bufferPointer, managedBuffer, 0, requiredBufferSize);
        Marshal.FreeHGlobal(bufferPointer);
        result = new ProcessSummary[operation.processCount];
        using var reader = new BinaryReader(new MemoryStream(managedBuffer));
        for (var i = 0; i < result.Length; i++)
        {
            result[i] = ProcessSummary.FromStream(reader);
        }

        return true;
    }

    private int GetProcessListRequiredBufferSize()
    {
        var operationPointer = MarshalUtility.AllocEmptyStruct<Operations.KERNEL_PROCESS_LIST_OPERATION>();
        var operationSize = Marshal.SizeOf<Operations.KERNEL_PROCESS_LIST_OPERATION>();
        var flag = WinApi.DeviceIoControl(_driverHandle, Operations.IO_GET_PROCESS_LIST, operationPointer, operationSize, operationPointer, operationSize,
            IntPtr.Zero, IntPtr.Zero);
        if (!flag) return 0;
        var operation =
            MarshalUtility.GetStructFromMemory<Operations.KERNEL_PROCESS_LIST_OPERATION>(operationPointer);
        var flag2 = operation.processCount == 0 && operation.bufferSize > 0;
        return flag2 ? operation.bufferSize : 0;
    }

    public bool UnloadDriver()
    {
        if (_driverHandle == WinApi.INVALID_HANDLE_VALUE) return false;
        var result = WinApi.DeviceIoControl(_driverHandle, Operations.IO_UNLOAD_DRIVER, IntPtr.Zero, 0, IntPtr.Zero, 0, IntPtr.Zero, IntPtr.Zero);
        Dispose();
        return result;
    }

    private readonly IntPtr _driverHandle = WinApi.CreateFileA(registryPath, FileAccess.ReadWrite, FileShare.ReadWrite, IntPtr.Zero, FileMode.Open, 0,
        IntPtr.Zero);

    public void Dispose()
    {
        try
        {
            _ = WinApi.CloseHandle(_driverHandle);
        }
        catch (Exception)
        {
            // ignored
        }
    }

    ~DriverInterface()
    {
        try
        {
            _ = WinApi.CloseHandle(_driverHandle);
        }
        catch (Exception)
        {
            // ignored
        }
    }
}
using System.Runtime.InteropServices;
using UCheck.Lib.Utility;

namespace UCheck.Lib;

public class Mem(DriverInterface kernelDriver)
{
    private readonly DriverInterface _kernelDriver = kernelDriver;

    public static Mem Instance { get; private set; }

    public static void CreateInstance()
    {
        if (!DriverInterface.IsDriverOpen("\\\\.\\KsDumper")) throw new InvalidOperationException("Can't find the driver");

        Instance = new Mem(new DriverInterface("\\\\.\\KsDumper"));

        if (!Instance._kernelDriver.HasValidHandle())
        {
            throw new InvalidOperationException("Can't find a valid handle");
        }
    }

    public byte[] ReadProcessBytes(int processId, IntPtr address, int size)
    {
        var unmanagedBytePointer = MarshalUtility.AllocZeroFilled(size);
        _kernelDriver.CopyVirtualMemory(processId, address, unmanagedBytePointer, size);
        var buffer = new byte[size];
        Marshal.Copy(unmanagedBytePointer, buffer, 0, size);
        Marshal.FreeHGlobal(unmanagedBytePointer);
        return buffer;
    }

    public ProcessSummary GetProcessSummary(int processId)
    {
        return ProcessSummary.ProcessSummaryFromId(_kernelDriver, processId);
    }
}
using System;
using System.Runtime.InteropServices;
namespace GameEventsPlugin
{
  public class Mem
  {

    private readonly DriverInterface _kernelDriver;

    public Mem(DriverInterface kernelDriver)
    {
      _kernelDriver = kernelDriver;
    }

    public static Mem Instance { get; private set; }

    public static void CreateInstance()
    {
      if (!DriverInterface.IsDriverOpen("\\\\.\\KsDumper")) throw new InvalidOperationException("Can't find the driver");
      var driverInterface = new DriverInterface("\\\\.\\KsDumper");
      Instance = new Mem(driverInterface);

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
}
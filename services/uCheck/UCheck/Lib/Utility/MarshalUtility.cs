using System.Runtime.InteropServices;

namespace UCheck.Lib.Utility;

// Token: 0x0200000A RID: 10
public static class MarshalUtility
{
    // Token: 0x0600005D RID: 93 RVA: 0x000045F4 File Offset: 0x000027F4
    public static IntPtr CopyStructToMemory<T>(T obj) where T : struct
    {
        var unmanagedAddress = AllocEmptyStruct<T>();
        Marshal.StructureToPtr(obj, unmanagedAddress, true);
        return unmanagedAddress;
    }

    // Token: 0x0600005E RID: 94 RVA: 0x00004618 File Offset: 0x00002818
    public static IntPtr AllocEmptyStruct<T>() where T : struct
    {
        var structSize = Marshal.SizeOf<T>();
        return AllocZeroFilled(Marshal.SizeOf<T>());
    }

    // Token: 0x0600005F RID: 95 RVA: 0x0000463C File Offset: 0x0000283C
    public static IntPtr AllocZeroFilled(int size)
    {
        var allocatedPointer = Marshal.AllocHGlobal(size);
        ZeroMemory(allocatedPointer, size);
        return allocatedPointer;
    }

    // Token: 0x06000060 RID: 96 RVA: 0x00004660 File Offset: 0x00002860
    public static void ZeroMemory(IntPtr pointer, int size)
    {
        for (var i = 0; i < size; i++)
        {
            Marshal.WriteByte(pointer + i, 0);
        }
    }

    public static T GetStructFromMemory<T>(IntPtr unmanagedAddress, bool freeMemory = true) where T : struct
    {
        T structObj = Marshal.PtrToStructure<T>(unmanagedAddress);
        if (freeMemory)
        {
            Marshal.FreeHGlobal(unmanagedAddress);
        }

        return structObj;
    }
}
using System.Diagnostics;
using UCheck.Lib;

namespace UCheck;

public class SigScan
{
    /// <summary>
    /// m_vDumpedRegion
    /// 
    ///     The memory dumped from the external process.
    /// </summary>
    public byte[] m_vDumpedRegion;


    #region "sigScan Class Construction"

    /// <summary>
    /// SigScan
    /// 
    ///     Main class constructor that uses no params. 
    ///     Simply initializes the class properties and 
    ///     expects the user to set them later.
    /// </summary>
    public SigScan()
    {
        Process = null;
        Address = IntPtr.Zero;
        Size = 0;
        m_vDumpedRegion = null;
    }

    /// <summary>
    /// SigScan
    /// 
    ///     Overloaded class constructor that sets the class
    ///     properties during construction.
    /// </summary>
    /// <param name="proc">The process to dump the memory from.</param>
    /// <param name="addr">The started address to begin the dump.</param>
    /// <param name="size">The size of the dump.</param>
    public SigScan(ProcessSummary proc, IntPtr addr, int size)
    {
        Process = proc;
        Address = addr;
        Size = size;
    }

    #endregion

    #region "sigScan Class Private Methods"

    /// <summary>
    /// DumpMemory
    /// 
    ///     Internal memory dump function that uses the set class
    ///     properties to dump a memory region.
    /// </summary>
    /// <returns>Boolean based on RPM results and valid properties.</returns>
    public bool DumpMemory()
    {
        try
        {
            if (Address == IntPtr.Zero)
                return false;
            if (Size == 0)
                return false;

            // Create the region space to dump into.
            //m_vDumpedRegion = new byte[Size];

            m_vDumpedRegion = Mem.Instance.ReadProcessBytes(Process.ProcessId, Address, Size);
            //var bReturn =
            //    // Dump the memory.
            //    ReadProcessMemory(
            //        Process.Handle, Address, m_vDumpedRegion, Size, out var nBytesRead
            //    );

            // Validation checks.
            return true;
            //return bReturn && nBytesRead == Size;
        }
        catch (Exception)
        {
            return false;
        }
    }

    /// <summary>
    /// MaskCheck
    /// 
    ///     Compares the current pattern byte to the current memory dump
    ///     byte to check for a match. Uses wildcards to skip bytes that
    ///     are deemed unneeded in the compares.
    /// </summary>
    /// <param name="nOffset">Offset in the dump to start at.</param>
    /// <param name="btPattern">Pattern to scan for.</param>
    /// <param name="strMask">Mask to compare against.</param>
    /// <returns>Boolean depending on if the pattern was found.</returns>
    private bool MaskCheck(int nOffset, byte[] btPattern, string strMask)
    {
        // Loop the pattern and compare to the mask and dump.
        for (var x = 0; x < btPattern.Length; x++)
        {
            switch (strMask[x])
            {
                // If the mask char is a wildcard, just continue.
                case '?':
                    continue;
                // If the mask char is not a wildcard, ensure a match is made in the pattern.
                case 'x' when (btPattern[x] != m_vDumpedRegion[nOffset + x]):
                    return false;
            }
        }

        // The loop was successful so we found the pattern.
        return true;
    }

    #endregion

    #region "sigScan Class Public Methods"

    /// <summary>
    /// FindPattern
    /// 
    ///     Attempts to locate the given pattern inside the dumped memory region
    ///     compared against the given mask. If the pattern is found, the offset
    ///     is added to the located address and returned to the user.
    /// </summary>
    /// <param name="btPattern">Byte pattern to look for in the dumped region.</param>
    /// <param name="strMask">The mask string to compare against.</param>
    /// <param name="nOffset">The offset added to the result address.</param>
    /// <returns>IntPtr - zero if not found, address if found.</returns>
    public IntPtr FindPattern(byte[] btPattern, string strMask, int nOffset)
    {
        try
        {
            // Dump the memory region if we have not dumped it yet.
            if (m_vDumpedRegion == null || m_vDumpedRegion.Length == 0)
            {
                if (!DumpMemory())
                    return IntPtr.Zero;
            }

            // Ensure the mask and pattern lengths match.
            if (strMask.Length != btPattern.Length)
                return IntPtr.Zero;

            // Loop the region and look for the pattern.
            for (var x = 0; x < m_vDumpedRegion.Length - strMask.Length; x++)
            {
                if (MaskCheck(x, btPattern, strMask))
                {
                    // The pattern was found, return it.
                    return IntPtr.Add(Address, x + nOffset);
                }
            }

            // Pattern was not found.
            return IntPtr.Zero;
        }
        catch (Exception)
        {
            return IntPtr.Zero;
        }
    }

    public List<IntPtr> FindPatterns(byte[] btPattern, string strMask, int nOffset)
    {
        var ptrs = new List<IntPtr>();
        try
        {
            // Dump the memory region if we have not dumped it yet.
            if (m_vDumpedRegion == null || m_vDumpedRegion.Length == 0)
            {
                if (!DumpMemory())
                    return null;
            }

            // Ensure the mask and pattern lengths match.
            if (strMask.Length != btPattern.Length)
                return null;

            // Loop the region and look for the pattern.
            for (var x = 0; x < m_vDumpedRegion.Length; x++)
            {
                if (MaskCheck(x, btPattern, strMask))
                {
                    // The pattern was found, return it.
                    ptrs.Add(IntPtr.Add(Address, x + nOffset));
                }
            }

            // Pattern was not found.
            return ptrs;
        }
        catch (Exception)
        {
            return null;
        }
    }

    /// <summary>
    /// ResetRegion
    /// 
    ///     Resets the memory dump array to nothing to allow
    ///     the class to redump the memory.
    /// </summary>
    public void ResetRegion()
    {
        m_vDumpedRegion = null;
    }

    #endregion

    #region "sigScan Class Properties"

    /// <summary>
    /// m_vProcess
    /// 
    ///     The process we want to read the memory of.
    /// </summary>
    public ProcessSummary Process { get; set; }

    /// <summary>
    /// m_vAddress
    /// 
    ///     The starting address we want to begin reading at.
    /// </summary>
    public IntPtr Address { get; set; }

    /// <summary>
    /// m_vSize
    /// 
    ///     The number of bytes we wish to read from the process.
    /// </summary>
    public int Size { get; set; }

    #endregion
}
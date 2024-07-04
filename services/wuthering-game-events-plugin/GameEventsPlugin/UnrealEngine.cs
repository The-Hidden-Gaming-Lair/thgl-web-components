using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Xml.Linq;
using System.Xml.Schema;


namespace GameEventsPlugin
{
  public class UnrealEngine
  {
    public static UnrealEngine Instance;
    static IntPtr GNamesPattern;
    public static IntPtr GNames;
    public static IntPtr Objects;
    static IntPtr GWorldPtrPattern;
    public static IntPtr GWorldPtr;
    public static Memory Memory;
    public UnrealEngine(Memory mem) { Memory = mem; Instance = this; }
    public static bool IsReady = false;
    public void UpdateAddresses()
    {
      {
        GNamesPattern = Memory.FindPattern("74 09 48 8D 15 ? ? ? ? EB 16");
        var offset = Memory.ReadProcessMemory<int>(GNamesPattern + 5);
        GNames = GNamesPattern + offset + 9;
        var name = UEObject.GetName(3);
        if (name != "ByteProperty")
        {
          throw new Exception($"bad GNames {name} @ 0x{GNames.ToString("X4")} with base address 0x" + Memory.BaseAddress.ToString("X4"));
        }
      }

      {
        var stringAddr = Memory.FindStringRef("    SeamlessTravel FlushLevelStreaming");
        GWorldPtrPattern = Memory.FindPattern("48 89 05", stringAddr - 0x500, 0x500);

        var offset = UnrealEngine.Memory.ReadProcessMemory<int>(GWorldPtrPattern + 3);
        GWorldPtr = GWorldPtrPattern + offset + 7;
        UpdateUEObject();
      }

      IsReady = true;
    }
    public void UpdateUEObject()
    {
      var world = Memory.ReadProcessMemory<IntPtr>(GWorldPtr);
      {
        var foundClassAndName = false;
        for (var c = 0; c < 0x50 && !foundClassAndName; c += 0x8)
        {
          var classPtr = Memory.ReadProcessMemory<IntPtr>(world + c);
          if (classPtr.ToInt64() == 0x0) continue;
          for (var n = 0; n < 0x50 && !foundClassAndName; n += 0x8)
          {
            var classNameIndex = Memory.ReadProcessMemory<int>(classPtr + n);
            var name = UEObject.GetName(classNameIndex);
            if (name == "World")
            {
              UEObject.classOffset = c;
              UEObject.nameOffset = n;
              foundClassAndName = true;
            }
          }
        }
        if (!foundClassAndName) throw new Exception("bad World or offsets?");
      }
      {
        var foundOuter = false;
        var classPtr = Memory.ReadProcessMemory<IntPtr>(world + UEObject.classOffset);
        for (var o = 0; o < 0x50; o += 0x8)
        {
          var outerObj = Memory.ReadProcessMemory<IntPtr>(classPtr + o);
          var classNameIndex = Memory.ReadProcessMemory<int>(outerObj + UEObject.nameOffset);
          var name = UEObject.GetName(classNameIndex);
          if (name == "/Script/Engine")
          {
            UEObject.objectOuterOffset = o;
            foundOuter = true;
            break;
          }
        }
        if (!foundOuter) throw new Exception("bad outer addr");
      }
      {
        var foundSuper = false;
        var classPtr = Memory.ReadProcessMemory<IntPtr>(world + UEObject.classOffset);
        for (var o = 0; o < 0x50; o += 0x8)
        {
          var superObj = Memory.ReadProcessMemory<IntPtr>(classPtr + o);
          var classNameIndex = Memory.ReadProcessMemory<int>(superObj + UEObject.nameOffset);
          var name = UEObject.GetName(classNameIndex);
          if (name == "Object")
          {
            UEObject.structSuperOffset = o;
            foundSuper = true;
            break;
          }
        }
        if (!foundSuper) throw new Exception("bad super addr");
      }
      {
        var foundChildsAndFieldName = false;
        var classPtr = Memory.ReadProcessMemory<IntPtr>(world + UEObject.classOffset);
        for (var c = 0; c < 0x80 && !foundChildsAndFieldName; c += 0x8)
        {
          var childPtr = Memory.ReadProcessMemory<IntPtr>(classPtr + c);
          if (childPtr.ToInt64() == 0x0) continue;
          for (var n = 0; n < 0x80 && !foundChildsAndFieldName; n += 0x8)
          {
            var classNameIndex = Memory.ReadProcessMemory<int>(childPtr + n);
            var name = UEObject.GetName(classNameIndex);
            if (name == "PersistentLevel")
            {
              UEObject.childPropertiesOffset = c;
              UEObject.fieldNameOffset = n;
              foundChildsAndFieldName = true;
            }
          }
        }
        //if (!foundChildsAndFieldName) throw new Exception("bad childs offset");
      }
      {
        var foundNextField = false;
        var classPtr = Memory.ReadProcessMemory<IntPtr>(world + UEObject.classOffset);
        var fieldPtr = Memory.ReadProcessMemory<IntPtr>(classPtr + UEObject.childPropertiesOffset);
        for (var c = 0; c < 0x80 && !foundNextField; c += 0x8)
        {
          var childClassPtr = Memory.ReadProcessMemory<IntPtr>(fieldPtr + c);
          if (childClassPtr.ToInt64() == 0x0) continue;
          var classNameIndex = Memory.ReadProcessMemory<int>(childClassPtr + UEObject.fieldNameOffset);
          var name = UEObject.GetName(classNameIndex);
          if (name == "NetDriver")
          {
            UEObject.fieldNextOffset = c;
            foundNextField = true;
          }
        }
        if (!foundNextField) throw new Exception("bad next field offset");
      }
      {
        var foundFuncs = false;
        var classPtr = Memory.ReadProcessMemory<IntPtr>(world + UEObject.classOffset);
        for (var c = 0; c < 0x80 && !foundFuncs; c += 0x8)
        {
          var childPtr = Memory.ReadProcessMemory<IntPtr>(classPtr + c);
          if (childPtr.ToInt64() == 0x0) continue;
          var classNameIndex = Memory.ReadProcessMemory<int>(childPtr + UEObject.nameOffset);
          var name = UEObject.GetName(classNameIndex);
          if (name == "K2_GetWorldSettings")
          {
            UEObject.childrenOffset = c;
            foundFuncs = true;
          }
        }
        if (!foundFuncs)
        {
          var testObj = new UEObject(world);
          var isField = testObj["K2_GetWorldSettings"];
          if (isField != null)
          {
            UEObject.childrenOffset = UEObject.childPropertiesOffset;
            foundFuncs = true;
          }
        }
        //if (!foundFuncs) throw new Exception("bad childs offset");
      }
      {
        var foundNextField = false;
        var classPtr = Memory.ReadProcessMemory<IntPtr>(world + UEObject.classOffset);
        var fieldPtr = Memory.ReadProcessMemory<IntPtr>(classPtr + UEObject.childPropertiesOffset);
        for (var c = 0; c < 0x80 && !foundNextField; c += 0x8)
        {
          var childClassPtr = Memory.ReadProcessMemory<IntPtr>(fieldPtr + c);
          if (childClassPtr.ToInt64() == 0x0) continue;
          var classNameIndex = Memory.ReadProcessMemory<int>(childClassPtr);
          var name = UEObject.GetName(classNameIndex);
          if (name == "ObjectProperty")
          {
            UEObject.fieldClassOffset = c;
            foundNextField = true;
          }
        }
        if (!foundNextField) throw new Exception("bad field class offset");
      }
      {
        var foundFieldOffset = false;
        var classPtr = Memory.ReadProcessMemory<IntPtr>(world + UEObject.classOffset);
        var fieldPtr = Memory.ReadProcessMemory<IntPtr>(classPtr + UEObject.childPropertiesOffset);
        for (var c = 0x0; c < 0x80 && !foundFieldOffset; c += 0x4)
        {
          var fieldOffset = Memory.ReadProcessMemory<IntPtr>(fieldPtr + c);
          var nextFieldPtr = Memory.ReadProcessMemory<IntPtr>(fieldPtr + UEObject.fieldNextOffset);
          var fieldOffsetPlus8 = Memory.ReadProcessMemory<IntPtr>(nextFieldPtr + c);
          if ((fieldOffset + 8) == fieldOffsetPlus8)
          {
            UEObject.fieldOffset = c;
            foundFieldOffset = true;
          }
        }
        // if (!foundFieldOffset) throw new Exception("bad field offset");
      }
      {
        var World = new UEObject(world);
        var field = World.GetFieldAddr("StreamingLevelsToConsider");
        var foundPropertySize = false;
        for (var c = 0x60; c < 0x100 && !foundPropertySize; c += 0x8)
        {
          var classAddr = Memory.ReadProcessMemory<IntPtr>(field + c);
          var classNameIndex = Memory.ReadProcessMemory<Int32>(classAddr + UEObject.nameOffset);
          var name = UEObject.GetName(classNameIndex);
          if (name == "StreamingLevelsToConsider")
          {
            UEObject.propertySize = c;
            foundPropertySize = true;
          }
        }
        if (!foundPropertySize) throw new Exception("bad property size offset");
      }
    }
  }

  public class UEObject
  {
    public static int objectOuterOffset = 0x20;
    public static int classOffset = 0x10;
    public static int nameOffset = 0x18;
    public static int structSuperOffset = 0x40;
    public static int childPropertiesOffset = 0x50;
    public static int childrenOffset = 0x48;
    public static int fieldNameOffset = 0x28;
    public static int fieldTypeNameOffset = 0;
    public static int fieldClassOffset = 0x8;
    public static int fieldNextOffset = 0x20;
    //public static int fieldOffset = 0x4C;
    public static int fieldOffset = 0x44;
    //public static int propertySize = 0x80;
    public static int propertySize = 0x78;
    public static int enumArrayOffset = 0x40;
    public static int enumCountOffset = 0x48;

    static ConcurrentDictionary<string, string> AddrNameToFullName = new ConcurrentDictionary<string, string>();
    static ConcurrentDictionary<IntPtr, IntPtr> AddrToClass = new ConcurrentDictionary<IntPtr, IntPtr>();
    static ConcurrentDictionary<IntPtr, string> ClassToName = new ConcurrentDictionary<IntPtr, string>();
    static ConcurrentDictionary<Int64, string> ClassIndexToName = new ConcurrentDictionary<Int64, string>();
    static ConcurrentDictionary<IntPtr, ConcurrentDictionary<string, IntPtr>> ClassFieldToAddr = new ConcurrentDictionary<IntPtr, ConcurrentDictionary<string, IntPtr>>();
    static ConcurrentDictionary<IntPtr, int> FieldAddrToOffset = new ConcurrentDictionary<IntPtr, int>();
    static ConcurrentDictionary<IntPtr, string> FieldAddrToType = new ConcurrentDictionary<IntPtr, string>();

    static ConcurrentDictionary<IntPtr, string> PrevClassToName = new ConcurrentDictionary<IntPtr, string>();

    public static void Reset()
    {
      UEObject.AddrNameToFullName.Clear();
      UEObject.AddrToClass.Clear();
      UEObject.ClassToName.Clear();
      UEObject.ClassIndexToName.Clear();
      UEObject.ClassFieldToAddr.Clear();
      UEObject.FieldAddrToOffset.Clear();
      UEObject.FieldAddrToType.Clear();
    }

    public int GetFieldOffset(IntPtr fieldAddr)
    {
      if (FieldAddrToOffset.ContainsKey(fieldAddr)) return FieldAddrToOffset[fieldAddr];
      var offset = UnrealEngine.Memory.ReadProcessMemory<int>(fieldAddr + fieldOffset);
      FieldAddrToOffset[fieldAddr] = offset;
      return offset;
    }
    String _className;
    public String ClassName
    {
      get
      {
        if (_className != null) return _className;
        _className = GetFullPath();
        return _className;
      }
    }
    public IntPtr _classAddr = (IntPtr)Int64.MaxValue;
    public IntPtr ClassAddr
    {
      get
      {
        if (_classAddr.ToInt64() != Int64.MaxValue) return _classAddr;
        if (AddrToClass.ContainsKey(Address))
        {
          _classAddr = AddrToClass[Address];
          return _classAddr;
        }
        _classAddr = UnrealEngine.Memory.ReadProcessMemory<IntPtr>(Address + classOffset);
        AddrToClass[Address] = _classAddr;
        return _classAddr;
      }
    }
    public UEObject(IntPtr address)
    {
      Address = address;
    }

    public static String GetName(int key)
    {
      if (ClassIndexToName.ContainsKey(key))
      {
        return ClassIndexToName[key];
      }
      var namePtrAddr = (IntPtr)(UnrealEngine.GNames.ToInt64() + ((key >> 16) + 2) * 8);
      var namePtr = UnrealEngine.Memory.ReadProcessMemory<Int64>(namePtrAddr);
      if (namePtr == 0)
      {
        ClassIndexToName[key] = "badIndex";
        return "badIndex";
      }
      // var offset = 0x04 * (key - 1) + ((key - 1) & 0xffff) * 8 - 8;
      var offset = (key & 0xffff) * 4 + 4;

      //var offset = (key & 0xffff) * 2;
      var nameEntry = UnrealEngine.Memory.ReadProcessMemory<UInt16>((IntPtr)(namePtr + offset));
      var nameLength = (nameEntry / 2);
      //var nameLength = (nameEntry >> 6);
      if (nameLength <= 0)
      {
        ClassIndexToName[key] = "badIndex";
        return "badIndex";
      }

      UnrealEngine.Memory.maxStringLength = nameLength;
      var addr = (IntPtr)(namePtr + offset + 2);
      string result = UnrealEngine.Memory.ReadProcessMemory<String>(addr);
      UnrealEngine.Memory.maxStringLength = 0x100;
      ClassIndexToName[key] = result;
      return result;
    }

    String _name;
    public String GetName()
    {
      if (_name != null) return _name;
      var classPtr = UnrealEngine.Memory.ReadProcessMemory<IntPtr>(Address + classOffset);
      if (ClassToName.ContainsKey(classPtr))
      {
        return ClassToName[classPtr];
      }
      var classNameIndex = UnrealEngine.Memory.ReadProcessMemory<int>(classPtr + nameOffset);
      ClassToName[ClassAddr] = GetName(classNameIndex);
      return ClassToName[ClassAddr];
    }

    public String GetFullPath()
    {
      var name = GetName();
      var key = name + Address.ToString();
      if (AddrNameToFullName.ContainsKey(key)) return AddrNameToFullName[key];
      var outerEntityAddr = Address;
      var parentName = "";
      while (true)
      {
        var tempOuterEntityAddr = UnrealEngine.Memory.ReadProcessMemory<IntPtr>(outerEntityAddr + objectOuterOffset);
        if (tempOuterEntityAddr == outerEntityAddr || tempOuterEntityAddr.ToInt64() == 0) break;
        outerEntityAddr = tempOuterEntityAddr;
        var outerNameIndex = UnrealEngine.Memory.ReadProcessMemory<int>(outerEntityAddr + nameOffset);
        var tempName = GetName(outerNameIndex);
        if (tempName == "") break;
        if (tempName == "None") break;
        parentName = tempName + "." + parentName;
      }
      name += " " + parentName;
      /*var nameIndex = UnrealEngine.Memory.ReadProcessMemory<int>(Address + nameOffset);
      name += GetName(nameIndex);*/
      AddrNameToFullName[key] = name;
      return name;
    }

    public String GetFieldType(IntPtr fieldAddr)
    {
      if (FieldAddrToType.ContainsKey(fieldAddr)) return FieldAddrToType[fieldAddr];
      var fieldType = UnrealEngine.Memory.ReadProcessMemory<IntPtr>(fieldAddr + fieldClassOffset);
      var name = GetName(UnrealEngine.Memory.ReadProcessMemory<int>(fieldType));
      FieldAddrToType[fieldAddr] = name;
      return name;
    }
    IntPtr GetFieldAddr(IntPtr origClassAddr, IntPtr classAddr, string fieldName)
    {
      if (!ClassFieldToAddr.ContainsKey(origClassAddr))
      {
        ClassFieldToAddr[origClassAddr] = new ConcurrentDictionary<string, IntPtr>();
      }

      if (ClassFieldToAddr[origClassAddr].ContainsKey(fieldName))
      {
        return ClassFieldToAddr[origClassAddr][fieldName];
      }

      var field = classAddr + childPropertiesOffset - fieldNextOffset;
      while ((field = UnrealEngine.Memory.ReadProcessMemory<IntPtr>(field + fieldNextOffset)).ToInt64() > 0)
      {
        var fName = GetName(UnrealEngine.Memory.ReadProcessMemory<int>(field + fieldNameOffset));
        ClassFieldToAddr[origClassAddr][fName] = field;
        if (fName == fieldName)
        {
          return field;
        }
      }
      var parentClass = UnrealEngine.Memory.ReadProcessMemory<IntPtr>(classAddr + structSuperOffset);
      if (parentClass.ToInt64() == 0)
      {
        if (!ClassFieldToAddr.ContainsKey(origClassAddr))
          ClassFieldToAddr[origClassAddr] = new ConcurrentDictionary<string, IntPtr>();
        ClassFieldToAddr[origClassAddr][fieldName] = (IntPtr)0;
        return (IntPtr)0;
      }
      return GetFieldAddr(origClassAddr, parentClass, fieldName);
    }
    public IntPtr GetFieldAddr(string fieldName)
    {
      return GetFieldAddr(ClassAddr, ClassAddr, fieldName);
    }

    public Int64 _value = 0xcafeb00;
    public Int64 Value
    {
      get
      {
        if (_value != 0xcafeb00) return _value;
        _value = UnrealEngine.Memory.ReadProcessMemory<Int64>(Address);
        return _value;
      }

    }

    UInt64 boolMask = 0;
    public Boolean Flag
    {
      get
      {
        var val = UnrealEngine.Memory.ReadProcessMemory<UInt64>(Address);
        return ((val & boolMask) == boolMask);
      }
    }

    public List<string> GetFieldNames()
    {
      return GetFieldNames(ClassAddr, new List<IntPtr>(), "");
    }

    public List<string> GetFieldNames(IntPtr addr, List<IntPtr> visited, string pad)
    {
      pad += "  ";
      var list = new List<string>();
      var tempEntity = addr;

      while (true)
      {
        var classNameIndex = UnrealEngine.Memory.ReadProcessMemory<Int32>(tempEntity + UEObject.nameOffset);
        var name = UEObject.GetName(classNameIndex);

        list.Add(name);
        var field = tempEntity + UEObject.childPropertiesOffset - UEObject.fieldNextOffset;

        tempEntity = UnrealEngine.Memory.ReadProcessMemory<IntPtr>(tempEntity + UEObject.structSuperOffset);

        if (visited.Contains(field))
        {
          break;
        }
        visited.Add(field);
        while ((Int64)(field = UnrealEngine.Memory.ReadProcessMemory<IntPtr>(field + UEObject.fieldNextOffset)) > 0)
        {
          var fName = UEObject.GetName(UnrealEngine.Memory.ReadProcessMemory<Int32>(field + UEObject.fieldNameOffset));
          var fType = GetFieldType(field);
          var fValue = "(" + field.ToString() + ")";
          var obj = this[fName];
          List<string> more = new List<string>();

          if (fType == "BoolProperty")
          {
            fType = "Boolean";
            if (obj != null)
            {
              fValue = obj.Flag.ToString();
            }
          }
          else if (fType == "FloatProperty")
          {
            fType = "Single";
            if (obj != null)
            {
              fValue = BitConverter.ToSingle(BitConverter.GetBytes(obj.Value), 0).ToString();
            }
          }
          else if (fType == "IntProperty")
          {
            fType = "Int32";
            if (obj != null)
            {
              fValue = obj.Value.ToString();
            }
          }
          else if (fType == "ObjectProperty" || fType == "StructProperty")
          {
            var structFieldIndex = UnrealEngine.Memory.ReadProcessMemory<int>(UnrealEngine.Memory.ReadProcessMemory<IntPtr>(field + UEObject.propertySize) + UEObject.nameOffset);
            fType = UEObject.GetName(structFieldIndex);
            if (obj != null)
            {
              var newClassAddr = obj.ClassAddr;
              more = obj.GetFieldNames(newClassAddr, visited, pad);
            }
          } else
          {
            //
          }
          list.Add("  " + fType + " " + fName + " = " + fValue);
          more.ForEach(i =>
          {
            list.Add("  " + pad + i);
          });
        }


        if ((Int64)tempEntity == 0) break;
      }
      return list;
    }


    public IntPtr Address;
    public UEObject this[String key]
    {
      get
      {
        var fieldAddr = GetFieldAddr(key);
        if (fieldAddr.ToInt64() == 0)
        {
          return null;
        }
        var fieldType = GetFieldType(fieldAddr);
        var offset = GetFieldOffset(fieldAddr);
        UEObject obj;
        if (fieldType == "ObjectProperty" || fieldType == "ScriptStruct")
        {
          obj = new UEObject(UnrealEngine.Memory.ReadProcessMemory<IntPtr>(Address + offset));
        }
        else if (fieldType == "ArrayProperty")
        {
          obj = new UEObject(Address + offset);
          obj._classAddr = UnrealEngine.Memory.ReadProcessMemory<IntPtr>(fieldAddr + fieldClassOffset);

        }
        else if (fieldType.Contains("Bool"))
        {
          obj = new UEObject(Address + offset);
          obj._classAddr = UnrealEngine.Memory.ReadProcessMemory<IntPtr>(fieldAddr + classOffset);
          obj.boolMask = UnrealEngine.Memory.ReadProcessMemory<Byte>(fieldAddr + propertySize);
        }
        else if (fieldType.Contains("StructProperty"))
        {
          obj = new UEObject(Address + offset);
          obj._classAddr = UnrealEngine.Memory.ReadProcessMemory<IntPtr>(fieldAddr + propertySize);
        }
        else
        {
          obj = new UEObject(Address + offset);
          obj._classAddr = UnrealEngine.Memory.ReadProcessMemory<IntPtr>(fieldAddr + propertySize);
        }
        if (obj.Address.ToInt64() == 0)
        {
          obj = new UEObject((IntPtr)0);
        }
        return obj;
      }

    }
    public int Num
    {
      get
      {
        var num = UnrealEngine.Memory.ReadProcessMemory<int>(Address + 8);
        if (num > 0x10000) num = 0x10000;
        return num;
      }
    }
    public Byte[] _arrayCache = new Byte[0];
    public Byte[] ArrayCache
    {
      get
      {
        if (_arrayCache.Length != 0) return _arrayCache;
        _arrayCache = UnrealEngine.Memory.ReadProcessMemory(Value, Num * 8);
        return _arrayCache;
      }
    }
    public UEObject this[int index]
    {
      get
      {
        return new UEObject((IntPtr)BitConverter.ToInt64(ArrayCache, index * 8));
      }
    }
  }
}
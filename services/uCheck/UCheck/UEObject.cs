using System.Collections.Concurrent;
using System.Text;

namespace UCheck;

public class UEObject(nint address = 0)
{
    public static int objectOuterOffset = 0x20;
    public static int classOffset = 0x10;
    public static int nameOffset = 0x18;
    public static int structSuperOffset = 0x40;
    public static int childPropertiesOffset = 0x50;
    public static int childrenOffset = 0x48;
    public static int fieldNameOffset = 0x28;
    public static int fieldClassOffset = 0x8;
    public static int fieldNextOffset = 0x20;
    public static int funcNextOffset = 0x20;
    public static int fieldOffset = 0x4C;
    public static int propertySize = 0x78;
    public static int vTableFuncNum = 66;
    public static int funcFlagsOffset = 0xB0;


    static readonly ConcurrentDictionary<nint, string> AddrToName = new();
    static readonly ConcurrentDictionary<nint, nint> AddrToClass = new();
    static readonly ConcurrentDictionary<string, bool> ClassIsSubClass = new();
    static readonly ConcurrentDictionary<nint, string> ClassToName = new();

    static readonly ConcurrentDictionary<nint, ConcurrentDictionary<string, nint>> ClassFieldToAddr = new();

    static readonly ConcurrentDictionary<nint, int> FieldAddrToOffset = new();
    static readonly ConcurrentDictionary<nint, string> FieldAddrToType = new();

    public static void ClearCache()
    {
        AddrToName.Clear();
        AddrToClass.Clear();
        ClassIsSubClass.Clear();
        //ClassToAddr.Clear();
        ClassFieldToAddr.Clear();
        FieldAddrToOffset.Clear();
        FieldAddrToType.Clear();
    }

    public int GetFieldOffset(nint fieldAddr)
    {
        if (FieldAddrToOffset.TryGetValue(fieldAddr, out var fieldOffset1)) return fieldOffset1;
        var offset = UnrealEngine.Memory.ReadProcessMemory<int>(fieldAddr + fieldOffset);
        FieldAddrToOffset[fieldAddr] = offset;
        return offset;
    }

    string _className;

    public string ClassName
    {
        get
        {
            if (_className != null) return _className;
            _className = GetFullPath(); // GetFullName(ClassAddr);
            return _className;
        }
    }

    public nint _substructAddr = nint.MaxValue;
    public nint _classAddr = nint.MaxValue;

    public nint ClassAddr
    {
        get
        {
            if (_classAddr != nint.MaxValue) return _classAddr;
            if (AddrToClass.TryGetValue(Address, out var value))
            {
                _classAddr = value;
                return _classAddr;
            }

            _classAddr = UnrealEngine.Memory.ReadProcessMemory<nint>(Address + classOffset);
            AddrToClass[Address] = _classAddr;
            return _classAddr;
        }
    }

    public bool IsA(nint entityClassAddr, string targetClassName)
    {
        var key = entityClassAddr + ":" + targetClassName;
        if (ClassIsSubClass.TryGetValue(key, out var a)) return a;
        var tempEntityClassAddr = entityClassAddr;
        while (true)
        {
            var tempEntity = new UEObject(tempEntityClassAddr);
            var className = tempEntity.GetFullPath();
            if (className == targetClassName)
            {
                ClassIsSubClass[key] = true;
                return true;
            }

            tempEntityClassAddr = UnrealEngine.Memory.ReadProcessMemory<nint>(tempEntityClassAddr + structSuperOffset);
            if (tempEntityClassAddr == 0) break;
        }

        ClassIsSubClass[key] = false;
        return false;
    }

    public bool IsA(string className)
    {
        return IsA(ClassAddr, className);
    }

    public bool IsA<T>(out T converted) where T : UEObject
    {
        var n = typeof(T).Namespace;
        n = n.Substring(3, n.Length - 6).Replace(".", "/");
        n = "Class " + n + "." + typeof(T).Name;
        converted = As<T>();
        return IsA(ClassAddr, n);
    }

    public bool IsA<T>() where T : UEObject
    {
        if (Address == 0) return false;
        return IsA<T>(out _);
    }

    public static bool NewFName = true;

    public static string GetName(int key)
    {
        var namePtr = UnrealEngine.Memory.ReadProcessMemory<nint>(UnrealEngine.GNames + ((key >> 16) + 2) * 8);
        if (namePtr == 0) return "badIndex";
        var nameEntry = UnrealEngine.Memory.ReadProcessMemory<ushort>(namePtr + (key & 0xffff) * 2);
        var nameLength = (int)(nameEntry >> 6);
        if (nameLength <= 0) return "badIndex";

        UnrealEngine.Memory.MaxStringLength = nameLength;
        string result = UnrealEngine.Memory.ReadProcessMemory<string>(namePtr + (key & 0xffff) * 2 + 2);
        UnrealEngine.Memory.MaxStringLength = 0x100;
        return result;
    }

    public string GetName()
    {
        return GetName(UnrealEngine.Memory.ReadProcessMemory<int>(Address + nameOffset));
    }

    public string GetShortName()
    {
        if (ClassToName.TryGetValue(ClassAddr, out var name)) return name;
        var classNameIndex = UnrealEngine.Memory.ReadProcessMemory<int>(ClassAddr + nameOffset);
        ClassToName[ClassAddr] = GetName(classNameIndex);
        return ClassToName[ClassAddr];
    }

    public string GetFullPath()
    {
        if (AddrToName.TryGetValue(Address, out var path)) return path;
        var classPtr = UnrealEngine.Memory.ReadProcessMemory<nint>(Address + classOffset);
        var classNameIndex = UnrealEngine.Memory.ReadProcessMemory<int>(classPtr + nameOffset);
        var name = GetName(classNameIndex);
        var outerEntityAddr = Address;
        var parentName = "";
        while (true)
        {
            var tempOuterEntityAddr = UnrealEngine.Memory.ReadProcessMemory<nint>(outerEntityAddr + objectOuterOffset);
            //var tempOuterEntityAddr = Memory.ReadProcessMemory<UInt64>(outerEntityAddr + structSuperOffset);
            if (tempOuterEntityAddr == outerEntityAddr || tempOuterEntityAddr == 0) break;
            outerEntityAddr = tempOuterEntityAddr;
            var outerNameIndex = UnrealEngine.Memory.ReadProcessMemory<int>(outerEntityAddr + nameOffset);
            var tempName = GetName(outerNameIndex);
            if (tempName == "") break;
            if (tempName == "None") break;
            parentName = tempName + "." + parentName;
        }

        name += " " + parentName;
        var nameIndex = UnrealEngine.Memory.ReadProcessMemory<int>(Address + nameOffset);
        name += GetName(nameIndex);
        AddrToName[Address] = name;
        return name;
    }

    public string GetHierachy()
    {
        var sb = new StringBuilder();
        var tempEntityClassAddr = ClassAddr;
        while (true)
        {
            var tempEntity = new UEObject(tempEntityClassAddr);
            var className = tempEntity.GetFullPath();
            sb.AppendLine(className);
            tempEntityClassAddr = UnrealEngine.Memory.ReadProcessMemory<nint>(tempEntityClassAddr + structSuperOffset);
            if (tempEntityClassAddr == 0) break;
        }

        return sb.ToString();
    }

    public string GetFieldType(nint fieldAddr)
    {
        if (FieldAddrToType.TryGetValue(fieldAddr, out var type)) return type;
        var fieldType = UnrealEngine.Memory.ReadProcessMemory<nint>(fieldAddr + fieldClassOffset);
        var name = GetName(UnrealEngine.Memory.ReadProcessMemory<int>(fieldType + (NewFName ? 0 : fieldNameOffset)));
        FieldAddrToType[fieldAddr] = name;
        return name;
    }

    static nint GetFieldAddr(nint origClassAddr, nint classAddr, string fieldName)
    {
        while (true)
        {
            if (ClassFieldToAddr.ContainsKey(origClassAddr) && ClassFieldToAddr[origClassAddr].ContainsKey(fieldName))
                return ClassFieldToAddr[origClassAddr][fieldName];
            var field = classAddr + childPropertiesOffset - fieldNextOffset;
            while ((field = UnrealEngine.Memory.ReadProcessMemory<nint>(field + fieldNextOffset)) > 0)
            {
                var fName = GetName(UnrealEngine.Memory.ReadProcessMemory<int>(field + fieldNameOffset));
                if (fName == fieldName)
                {
                    if (!ClassFieldToAddr.ContainsKey(origClassAddr)) ClassFieldToAddr[origClassAddr] = new ConcurrentDictionary<string, nint>();
                    ClassFieldToAddr[origClassAddr][fieldName] = field;
                    return field;
                }
            }

            var parentClass = UnrealEngine.Memory.ReadProcessMemory<nint>(classAddr + structSuperOffset);
            //if (parentClass == classAddr) throw new Exception("parent is me");
            if (parentClass == 0)
            {
                if (!ClassFieldToAddr.ContainsKey(origClassAddr)) ClassFieldToAddr[origClassAddr] = new ConcurrentDictionary<string, nint>();
                ClassFieldToAddr[origClassAddr][fieldName] = 0;
                return 0;
            }

            classAddr = parentClass;
        }
    }

    public nint GetFieldAddr(string fieldName)
    {
        return GetFieldAddr(ClassAddr, ClassAddr, fieldName);
    }

    public nint GetFuncAddr(nint origClassAddr, nint classAddr, string fieldName)
    {
        while (true)
        {
            if (!NewFName) return GetFieldAddr(origClassAddr, classAddr, fieldName);
            if (ClassFieldToAddr.ContainsKey(origClassAddr) && ClassFieldToAddr[origClassAddr].ContainsKey(fieldName))
                return ClassFieldToAddr[origClassAddr][fieldName];
            var field = classAddr + childrenOffset - funcNextOffset;
            while ((field = UnrealEngine.Memory.ReadProcessMemory<nint>(field + funcNextOffset)) > 0)
            {
                var fName = GetName(UnrealEngine.Memory.ReadProcessMemory<int>(field + nameOffset));
                if (fName != fieldName) continue;
                if (!ClassFieldToAddr.ContainsKey(origClassAddr)) ClassFieldToAddr[origClassAddr] = new ConcurrentDictionary<string, nint>();
                ClassFieldToAddr[origClassAddr][fieldName] = field;
                return field;
            }

            var parentClass = UnrealEngine.Memory.ReadProcessMemory<nint>(classAddr + structSuperOffset);
            if (parentClass == classAddr) throw new Exception("parent is me");
            if (parentClass == 0) throw new Exception("bad field");
            classAddr = parentClass;
        }
    }

    public int FieldOffset;
    public byte[] Data;
    public nint _value = 0xcafeb00;

    public nint Value
    {
        get
        {
            if (_value != 0xcafeb00) return _value;
            _value = UnrealEngine.Memory.ReadProcessMemory<nint>(Address);
            return _value;
        }
    }


    ulong boolMask = 0;

    public bool Flag
    {
        get
        {
            var val = UnrealEngine.Memory.ReadProcessMemory<ulong>(Address);
            return ((val & boolMask) == boolMask);
        }
    }

    public nint Address = address;

    public UEObject this[string key]
    {
        get
        {
            var fieldAddr = GetFieldAddr(key);
            if (fieldAddr == 0) return null;
            var fieldType = GetFieldType(fieldAddr);
            var offset = GetFieldOffset(fieldAddr);
            UEObject obj;
            if (fieldType == "ObjectProperty" || fieldType == "ScriptStruct")
                obj = new UEObject(UnrealEngine.Memory.ReadProcessMemory<nint>(Address + offset)) { FieldOffset = offset };
            else if (fieldType == "ArrayProperty")
            {
                obj = new UEObject(Address + offset);
                obj._classAddr = UnrealEngine.Memory.ReadProcessMemory<nint>(fieldAddr + fieldClassOffset);
                var inner = UnrealEngine.Memory.ReadProcessMemory<nint>(fieldAddr + propertySize);
                var innerClass = UnrealEngine.Memory.ReadProcessMemory<nint>(inner + fieldClassOffset);
                obj._substructAddr = UnrealEngine.Memory.ReadProcessMemory<nint>(inner + propertySize);
                //obj._substructAddr;
            }
            else if (fieldType.Contains("Bool"))
            {
                obj = new UEObject(Address + offset);
                obj._classAddr = UnrealEngine.Memory.ReadProcessMemory<nint>(fieldAddr + classOffset);
                obj.boolMask = UnrealEngine.Memory.ReadProcessMemory<byte>(fieldAddr + propertySize);
            }
            else if (fieldType.Contains("Function"))
            {
                obj = new UEObject(fieldAddr);
                //obj.BaseObjAddr = Address;
            }
            else if (fieldType.Contains("StructProperty"))
            {
                obj = new UEObject(Address + offset);
                obj._classAddr = UnrealEngine.Memory.ReadProcessMemory<nint>(fieldAddr + propertySize);
            }
            else if (fieldType.Contains("FloatProperty"))
            {
                obj = new UEObject(Address + offset);
                obj._classAddr = 0;
            }
            else
            {
                obj = new UEObject(Address + offset);
                obj._classAddr = UnrealEngine.Memory.ReadProcessMemory<nint>(fieldAddr + propertySize);
            }

            if (obj.Address == 0)
            {
                obj = new UEObject(0);
                //var classInfo = Engine.Instance.DumpClass(ClassAddr);
                //throw new Exception("bad addr");
            }

            return obj;
        }
    }

    public int _num = int.MaxValue;

    public int Num
    {
        get
        {
            if (_num != int.MaxValue) return _num;
            _num = UnrealEngine.Memory.ReadProcessMemory<int>(Address + 8);
            if (_num > 0x10000) _num = 0x10000;
            return _num;
        }
    }

    public byte[] _arrayCache = Array.Empty<byte>();

    public byte[] ArrayCache
    {
        get
        {
            if (_arrayCache.Length != 0) return _arrayCache;
            _arrayCache = UnrealEngine.Memory.ReadProcessMemory(Value, Num * 8);
            return _arrayCache;
        }
    }

    public UEObject this[int index] => new((nint)BitConverter.ToUInt64(ArrayCache, index * 8));


    public T As<T>() where T : UEObject
    {
        var obj = (T)Activator.CreateInstance(typeof(T), Address);
        obj._classAddr = _classAddr;
        return obj;
    }
}
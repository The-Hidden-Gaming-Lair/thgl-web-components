using System.Text;

namespace UCheck;

public class UnrealEngine
{
    public static UnrealEngine Instance;
    static nint GNamesPattern;
    public static nint GNames;
    static nint GObjectsPattern;
    public static nint GObjects;
    static nint GWorldPtrPattern;
    public static nint GWorldPtr;
    static nint GEnginePattern;
    public static nint GEngine;
    public static nint GStaticCtor;
    public static Memory Memory;

    public UnrealEngine(Memory mem)
    {
        Memory = mem;
        Instance = this;
    }

    public void UpdateAddresses()
    {
        {
            GNamesPattern = Memory.FindPattern("74 09 48 8D 15 ? ? ? ? EB 16");
            var offset = Memory.ReadProcessMemory<int>(GNamesPattern + 5);
            GNames = GNamesPattern + offset + 9;
            if (UEObject.GetName(3) != "ByteProperty") throw new Exception("bad GNames");
            //DumpGNames();
        }
        {
            var stringAddr = Memory.FindStringRef("    SeamlessTravel FlushLevelStreaming");
            GWorldPtrPattern = Memory.FindPattern("48 89 05", stringAddr - 0x500, 0x500);
            //GWorldPtrPattern = Memory.FindPattern("48 89 05 ? ? ? ? 48 8B 76 78 F6 86");
            GObjectsPattern = Memory.FindPattern("48 8B 05 ? ? ? ? 48 8B 0C C8 ? 8D 04 D1 EB ?");

            var offset = Memory.ReadProcessMemory<int>(GWorldPtrPattern + 3);
            GWorldPtr = GWorldPtrPattern + offset + 7;
            UpdateUEObject();

            offset = Memory.ReadProcessMemory<int>(GObjectsPattern + 3);
            GObjects = GObjectsPattern + offset + 7 - Memory.BaseAddress;
        }
        {
            GEnginePattern = Memory.FindPattern("48 8B 0D ?? ?? ?? ?? 48 85 C9 74 1E 48 8B 01 FF 90");
            var offset = Memory.ReadProcessMemory<int>(GEnginePattern + 3);
            GEngine = Memory.ReadProcessMemory<nint>(GEnginePattern + offset + 7);
        }
        {
            var engine = new UEObject(GEngine);
            GStaticCtor = Memory.FindPattern(
                "4C 89 44 24 18 55 53 56 57 41 54 41 55 41 56 41 57 48 8D AC 24 ? ? ? ? 48 81 EC ? ? ? ? 48 8B 05 ? ? ? ? 48 33 C4");
        }
        //DumpSdk();
    }

    public void UpdateUEObject()
    {
        var world = Memory.ReadProcessMemory<nint>(GWorldPtr);
        {
            var classPtr = Memory.ReadProcessMemory<nint>(world + UEObject.classOffset);
            var foundClassAndName = false;
            for (var c = 0; c < 0x50 && !foundClassAndName; c += 0x8)
            {
                classPtr = Memory.ReadProcessMemory<nint>(world + c);
                if (classPtr == 0x0) continue;
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
            var classPtr = Memory.ReadProcessMemory<nint>(world + UEObject.classOffset);
            for (var o = 0; o < 0x50; o += 0x8)
            {
                var outerObj = Memory.ReadProcessMemory<nint>(classPtr + o);
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
            var classPtr = Memory.ReadProcessMemory<nint>(world + UEObject.classOffset);
            for (var o = 0; o < 0x50; o += 0x8)
            {
                var superObj = Memory.ReadProcessMemory<nint>(classPtr + o);
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
            var classPtr = Memory.ReadProcessMemory<nint>(world + UEObject.classOffset);
            for (var c = 0; c < 0x80 && !foundChildsAndFieldName; c += 0x8)
            {
                var childPtr = Memory.ReadProcessMemory<nint>(classPtr + c);
                if (childPtr == 0x0) continue;
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

            if (!foundChildsAndFieldName) throw new Exception("bad childs offset");
        }
        {
            var foundNextField = false;
            var classPtr = Memory.ReadProcessMemory<nint>(world + UEObject.classOffset);
            var fieldPtr = Memory.ReadProcessMemory<nint>(classPtr + UEObject.childPropertiesOffset);
            for (var c = 0; c < 0x80 && !foundNextField; c += 0x8)
            {
                var childClassPtr = Memory.ReadProcessMemory<nint>(fieldPtr + c);
                if (childClassPtr == 0x0) continue;
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
            var classPtr = Memory.ReadProcessMemory<nint>(world + UEObject.classOffset);
            for (var c = 0; c < 0x80 && !foundFuncs; c += 0x8)
            {
                var childPtr = Memory.ReadProcessMemory<nint>(classPtr + c);
                if (childPtr == 0x0) continue;
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

            if (!foundFuncs) throw new Exception("bad childs offset");
        }
        {
            var foundNextField = false;
            var classPtr = Memory.ReadProcessMemory<nint>(world + UEObject.classOffset);
            var fieldPtr = Memory.ReadProcessMemory<nint>(classPtr + UEObject.childrenOffset);
            for (var c = 0; c < 0x80 && !foundNextField; c += 0x8)
            {
                var childClassPtr = Memory.ReadProcessMemory<nint>(fieldPtr + c);
                if (childClassPtr == 0x0) continue;
                var classNameIndex = Memory.ReadProcessMemory<int>(childClassPtr + UEObject.nameOffset);
                var name = UEObject.GetName(classNameIndex);
                if (name == "HandleTimelineScrubbed")
                {
                    UEObject.funcNextOffset = c;
                    foundNextField = true;
                }
            }

            if (!foundNextField) throw new Exception("bad next offset");
        }
        {
            var foundNextField = false;
            var classPtr = Memory.ReadProcessMemory<nint>(world + UEObject.classOffset);
            var fieldPtr = Memory.ReadProcessMemory<nint>(classPtr + UEObject.childPropertiesOffset);
            for (var c = 0; c < 0x80 && !foundNextField; c += 0x8)
            {
                var childClassPtr = Memory.ReadProcessMemory<nint>(fieldPtr + c);
                if (childClassPtr == 0x0) continue;
                var classNameOffset = UEObject.NewFName ? 0 : UEObject.fieldNameOffset;
                var classNameIndex = Memory.ReadProcessMemory<int>(childClassPtr + classNameOffset);
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
            var classPtr = Memory.ReadProcessMemory<nint>(world + UEObject.classOffset);
            var fieldPtr = Memory.ReadProcessMemory<nint>(classPtr + UEObject.childPropertiesOffset);
            for (var c = 0x0; c < 0x80 && !foundFieldOffset; c += 0x4)
            {
                var fieldOffset = Memory.ReadProcessMemory<nint>(fieldPtr + c);
                var nextFieldPtr = Memory.ReadProcessMemory<nint>(fieldPtr + UEObject.fieldNextOffset);
                var fieldOffsetPlus8 = Memory.ReadProcessMemory<nint>(nextFieldPtr + c);
                if ((fieldOffset + 8) == fieldOffsetPlus8)
                {
                    UEObject.fieldOffset = c;
                    foundFieldOffset = true;
                }
            }

            if (!foundFieldOffset) throw new Exception("bad field offset");
        }
        {
            var World = new UEObject(world);
            var field = World.GetFieldAddr("StreamingLevelsToConsider");
            var foundPropertySize = false;
            for (var c = 0x60; c < 0x100 && !foundPropertySize; c += 0x8)
            {
                var classAddr = Memory.ReadProcessMemory<nint>(field + c);
                var classNameIndex = Memory.ReadProcessMemory<int>(classAddr + UEObject.nameOffset);
                var name = UEObject.GetName(classNameIndex);
                if (name == "StreamingLevelsToConsider")
                {
                    UEObject.propertySize = c;
                    foundPropertySize = true;
                }
            }

            if (!foundPropertySize) throw new Exception("bad property size offset");
        }
        {
            var vTable = Memory.ReadProcessMemory<nint>(world);
            var foundProcessEventOffset = false;
            for (var i = 50; i < 0x100 && !foundProcessEventOffset; i++)
            {
                var s = Memory.ReadProcessMemory<IntPtr>(vTable + i * 8);
                var sig = (ulong)Memory.FindPattern("40 55 56 57 41 54 41 55 41 56 41 57", s, 0X20);
                if (sig != 0)
                {
                    UEObject.vTableFuncNum = i;
                    foundProcessEventOffset = true;
                }
            }

            if (!foundProcessEventOffset) throw new Exception("bad process event offset");
        }
        {
            var testObj = new UEObject(world);
            var funcAddr = testObj.GetFuncAddr(testObj.ClassAddr, testObj.ClassAddr, "K2_GetWorldSettings");
            var foundFuncFlags = false;
            for (var i = 0; i < 0x200 && !foundFuncFlags; i += 8)
            {
                var flags = Memory.ReadProcessMemory<nint>(funcAddr + i);
                if (flags == 0x0008000104020401)
                {
                    UEObject.funcFlagsOffset = i;
                    foundFuncFlags = true;
                }
            }

            if (!foundFuncFlags) throw new Exception("bad func flags offset");
        }
    }

    public void DumpGNames()
    {
        var testObj = new UEObject(0);
        var sb = new StringBuilder();
        var i = 0;
        while (true)
        {
            var name = UEObject.GetName(i);

            if (name == "badIndex")
            {
                if ((i & 0xffff) > 0xff00)
                {
                    i += 0x10000 - (i % 0x10000);
                    continue;
                }

                break;
            }

            sb.AppendLine("[" + i + " | " + (i).ToString("X") + "] " + name);
            i += name.Length / 2 + name.Length % 2 + 1;
        }

        Directory.CreateDirectory(Memory.Process.ProcessName);
        File.WriteAllText(Memory.Process.ProcessName + @"\GNamesDump.txt", sb.ToString());
    }

    public string GetTypeFromFieldAddr(string fName, string fType, nint fAddr, out string gettersetter)
    {
        gettersetter = "";
        if (fType == "BoolProperty")
        {
            fType = "bool";
            gettersetter = "{ get { return this[nameof(" + fName + ")].Flag; } set { this[nameof(" + fName + ")].Flag = value; } }";
        }
        else if (fType == "ByteProperty" || fType == "Int8Property")
        {
            fType = "byte";
            gettersetter = "{ get { return this[nameof(" + fName + ")].GetValue<" + fType + ">(); } set { this[nameof(" + fName + ")].SetValue<" + fType +
                           ">(value); } }";
        }
        else if (fType == "Int16Property")
        {
            fType = "short";
            gettersetter = "{ get { return this[nameof(" + fName + ")].GetValue<" + fType + ">(); } set { this[nameof(" + fName + ")].SetValue<" + fType +
                           ">(value); } }";
        }
        else if (fType == "UInt16Property")
        {
            fType = "ushort";
            gettersetter = "{ get { return this[nameof(" + fName + ")].GetValue<" + fType + ">(); } set { this[nameof(" + fName + ")].SetValue<" + fType +
                           ">(value); } }";
        }
        else if (fType == "IntProperty")
        {
            fType = "int";
            gettersetter = "{ get { return this[nameof(" + fName + ")].GetValue<" + fType + ">(); } set { this[nameof(" + fName + ")].SetValue<" + fType +
                           ">(value); } }";
        }
        else if (fType == "UInt32Property")
        {
            fType = "uint";
            gettersetter = "{ get { return this[nameof(" + fName + ")].GetValue<" + fType + ">(); } set { this[nameof(" + fName + ")].SetValue<" + fType +
                           ">(value); } }";
        }
        else if (fType == "Int64Property")
        {
            fType = "long";
            gettersetter = "{ get { return this[nameof(" + fName + ")].GetValue<" + fType + ">(); } set { this[nameof(" + fName + ")].SetValue<" + fType +
                           ">(value); } }";
        }
        else if (fType == "UInt64Property")
        {
            fType = "ulong";
            gettersetter = "{ get { return this[nameof(" + fName + ")].GetValue<" + fType + ">(); } set { this[nameof(" + fName + ")].SetValue<" + fType +
                           ">(value); } }";
        }
        else if (fType == "FloatProperty")
        {
            fType = "float";
            gettersetter = "{ get { return this[nameof(" + fName + ")].GetValue<" + fType + ">(); } set { this[nameof(" + fName + ")].SetValue<" + fType +
                           ">(value); } }";
        }
        else if (fType == "DoubleProperty")
        {
            fType = "double";
            gettersetter = "{ get { return this[nameof(" + fName + ")].GetValue<" + fType + ">(); } set { this[nameof(" + fName + ")].SetValue<" + fType +
                           ">(value); } }";
        }
        else if (fType == "StrProperty")
        {
            fType = "unk";
        }
        else if (fType == "TextProperty")
        {
            fType = "unk";
        }
        else if (fType == "ObjectProperty")
        {
            var structFieldIndex =
                Memory.ReadProcessMemory<int>(Memory.ReadProcessMemory<nint>(fAddr + UEObject.propertySize) + UEObject.nameOffset);
            fType = UEObject.GetName(structFieldIndex);
            gettersetter = "{ get { return this[nameof(" + fName + ")].As<" + fType + ">(); } set { this[\"" + fName + "\"] = value; } }";
        }
        else if (fType == "ClassPtrProperty")
        {
            fType = "Object";
            gettersetter = "{ get { return this[nameof(" + fName + ")].As<" + fType + ">(); } set { this[\"" + fName + "\"] = value; } } // ClassPtrProperty";
        }
        else if (fType == "ScriptTypedElementHandle")
        {
            fType = "Object";
            gettersetter = "{ get { return this[nameof(" + fName + ")].As<" + fType + ">(); } set { this[\"" + fName + "\"] = value; } } // ClassPtrProperty";
        }
        else if (fType == "StructProperty")
        {
            var structFieldIndex =
                Memory.ReadProcessMemory<int>(Memory.ReadProcessMemory<nint>(fAddr + UEObject.propertySize) + UEObject.nameOffset);
            fType = UEObject.GetName(structFieldIndex);
            //gettersetter = "{ get { return UnrealEngine.Memory.ReadProcessMemory<" + fType + ">(this[nameof(" + fName + ")].Address); } set { this[nameof(" + fName + ")].SetValue<" + fType + ">(value); } }";
            gettersetter = "{ get { return this[nameof(" + fName + ")].As<" + fType + ">(); } set { this[\"" + fName + "\"] = value; } }";
        }
        else if (fType == "EnumProperty")
        {
            var structFieldIndex =
                Memory.ReadProcessMemory<int>(Memory.ReadProcessMemory<nint>(fAddr + UEObject.propertySize + 8) +
                                              UEObject.nameOffset);
            fType = UEObject.GetName(structFieldIndex);
            gettersetter = "{ get { return (" + fType + ")this[nameof(" + fName + ")].GetValue<int>(); } set { this[nameof(" + fName +
                           ")].SetValue<int>((int)value); } }";
        }
        else if (fType == "NameProperty")
        {
            fType = "unk";
        }
        else if (fType == "ArrayProperty")
        {
            var inner = Memory.ReadProcessMemory<nint>(fAddr + UEObject.propertySize);
            var innerClass = Memory.ReadProcessMemory<nint>(inner + UEObject.fieldClassOffset);
            var structFieldIndex = Memory.ReadProcessMemory<int>(innerClass);
            fType = UEObject.GetName(structFieldIndex);
            var innerType = GetTypeFromFieldAddr(fName, fType, inner, out gettersetter);
            gettersetter = "{ get { return new Array<" + innerType + ">(this[nameof(" + fName +
                           ")].Address); } }"; // set { this[\"" + fName + "\"] = value; } }";
            fType = "Array<" + innerType + ">";
        }
        else if (fType == "SoftObjectProperty")
        {
            fType = "unk";
        }
        else if (fType == "SoftClassProperty")
        {
            fType = "unk";
        }
        else if (fType == "WeakObjectProperty")
        {
            fType = "unk";
        }
        else if (fType == "LazyObjectProperty")
        {
            fType = "unk";
        }
        else if (fType == "DelegateProperty")
        {
            fType = "unk";
        }
        else if (fType == "MulticastSparseDelegateProperty")
        {
            fType = "unk";
        }
        else if (fType == "MulticastInlineDelegateProperty")
        {
            fType = "unk";
        }
        else if (fType == "ClassProperty")
        {
            fType = "unk";
        }
        else if (fType == "MapProperty")
        {
            fType = "unk";
        }
        else if (fType == "SetProperty")
        {
            fType = "unk";
        }
        else if (fType == "FieldPathProperty")
        {
            fType = "unk";
        }
        else if (fType == "InterfaceProperty")
        {
            fType = "unk";
        }
        else if (fType == "Enum")
        {
            fType = "UEEnum";
        }
        else if (fType == "DateTime")
        {
            fType = "UEDateTime";
        }
        else if (fType == "Guid")
        {
            fType = "UEGuid";
        }

        if (fType == "unk")
        {
            fType = "Object";
            gettersetter = "{ get { return this[nameof(" + fName + ")]; } set { this[nameof(" + fName + ")] = value; } }";
        }

        return fType;
    }

    public class Package
    {
        public string FullName;
        public string Name => FullName.Substring(FullName.LastIndexOf("/") + 1);
        public List<SDKClass> Classes = new List<SDKClass>();
        public List<Package> Dependencies = new List<Package>();

        public class SDKClass
        {
            public string SdkType;
            public string Namespace;
            public string Name;
            public string Parent;
            public List<SDKFields> Fields = new List<SDKFields>();
            public List<SDKFunctions> Functions = new List<SDKFunctions>();

            public class SDKFields
            {
                public string Type;
                public string Name;
                public string GetterSetter;
                public int EnumVal;
            }

            public class SDKFunctions
            {
                public string ReturnType;
                public string Name;
                public List<SDKFields> Params = new List<SDKFields>();
            }
        }
    }

    public void DumpSdk(string location = "")
    {
        if (location == "") location = Memory.Process.ProcessName;
        Directory.CreateDirectory(location);
        var entityList = Memory.ReadProcessMemory<nint>(Memory.BaseAddress + GObjects);
        var count = Memory.ReadProcessMemory<uint>(Memory.BaseAddress + GObjects + 0x14);
        entityList = Memory.ReadProcessMemory<nint>(entityList);
        var packages = new Dictionary<nint, List<nint>>();
        for (var i = 0; i < count; i++)
        {
            // var entityAddr = Memory.ReadProcessMemory<UInt64>((entityList + 8 * (i / 0x10400)) + 24 * (i % 0x10400));
            var entityAddr = Memory.ReadProcessMemory<nint>((entityList + 8 * (i >> 16)) + 24 * (i % 0x10000));
            if (entityAddr == 0) continue;
            var outer = entityAddr;
            while (true)
            {
                var tempOuter = Memory.ReadProcessMemory<nint>(outer + UEObject.objectOuterOffset);
                if (tempOuter == 0) break;
                outer = tempOuter;
            }

            if (!packages.ContainsKey(outer)) packages.Add(outer, new List<nint>());
            packages[outer].Add(entityAddr);
        }

        var ii = 0;
        var dumpedPackages = new List<Package>();
        foreach (var package in packages)
        {
            var packageObj = new UEObject(package.Key);
            var fullPackageName = packageObj.GetName();
            if (fullPackageName.Contains("TypedElementFrameworkSDK"))
                Console.WriteLine("");
            var dumpedClasses = new List<string>();
            var sdkPackage = new Package { FullName = fullPackageName };
            foreach (var objAddr in package.Value)
            {
                var obj = new UEObject(objAddr);
                if (dumpedClasses.Contains(obj.ClassName)) continue;
                dumpedClasses.Add(obj.ClassName);
                if (obj.ClassName.StartsWith("Package")) continue;
                var typeName = obj.ClassName.StartsWith("Class") ? "class" :
                    obj.ClassName.StartsWith("ScriptStruct") ? "class" :
                    obj.ClassName.StartsWith("Enum") ? "enum" : "unk";
                //if (obj.ClassName.StartsWith("BlueprintGenerated")) typeName = "class";
                var className = obj.GetName();
                if (typeName == "unk") continue;
                if (className == "Object") continue;
                var parentClass = Memory.ReadProcessMemory<nint>(obj.Address + UEObject.structSuperOffset);
                var sdkClass = new Package.SDKClass { Name = className, Namespace = fullPackageName, SdkType = typeName };
                if (typeName == "enum") sdkClass.Parent = "int";
                else if (parentClass != 0)
                {
                    var parentNameIndex = Memory.ReadProcessMemory<int>(parentClass + UEObject.nameOffset);
                    var parentName = UEObject.GetName(parentNameIndex);
                    sdkClass.Parent = parentName;
                }
                else sdkClass.Parent = "Object";
                //else throw new Exception("unparented obj not supported");

                if (typeName == "enum")
                {
                    var enumArray = Memory.ReadProcessMemory<nint>(objAddr + 0x40);
                    var enumCount = Memory.ReadProcessMemory<int>(objAddr + 0x48);
                    for (var i = 0; i < enumCount; i++)
                    {
                        var enumNameIndex = Memory.ReadProcessMemory<int>(enumArray + i * 0x10);
                        var enumName = UEObject.GetName(enumNameIndex);
                        enumName = enumName.Substring(enumName.LastIndexOf(":") + 1);
                        var enumNameRepeatedIndex = Memory.ReadProcessMemory<int>(enumArray + i * 0x10 + 4);
                        if (enumNameRepeatedIndex > 0)
                            enumName += "_" + enumNameRepeatedIndex;
                        var enumVal = Memory.ReadProcessMemory<int>(enumArray + i * 0x10 + 0x8);
                        sdkClass.Fields.Add(new Package.SDKClass.SDKFields { Name = enumName, EnumVal = enumVal });
                    }
                }
                else if (typeName == "unk")
                {
                    continue;
                }
                else
                {
                    var field = obj.Address + UEObject.childPropertiesOffset - UEObject.fieldNextOffset;
                    while ((field = Memory.ReadProcessMemory<nint>(field + UEObject.fieldNextOffset)) > 0)
                    {
                        var fName = UEObject.GetName(Memory.ReadProcessMemory<int>(field + UEObject.fieldNameOffset));
                        var fType = obj.GetFieldType(field);
                        var fValue = "(" + field.ToString() + ")";
                        var offset = (uint)obj.GetFieldOffset(field);
                        var gettersetter = "{ get { return new {0}(this[\"{1}\"].Address); } set { this[\"{1}\"] = value; } }";
                        fType = GetTypeFromFieldAddr(fName, fType, field, out gettersetter);
                        //if (typeName == "struct") gettersetter = ";";
                        if (fName == className) fName += "_value";
                        sdkClass.Fields.Add(new Package.SDKClass.SDKFields { Type = fType, Name = fName, GetterSetter = gettersetter });
                    }

                    field = obj.Address + UEObject.childrenOffset - UEObject.funcNextOffset;
                    while ((field = Memory.ReadProcessMemory<nint>(field + UEObject.funcNextOffset)) > 0)
                    {
                        var fName = UEObject.GetName(Memory.ReadProcessMemory<int>(field + UEObject.nameOffset));
                        if (fName == className) fName += "_value";
                        var func = new Package.SDKClass.SDKFunctions { Name = fName };
                        var fField = field + UEObject.childPropertiesOffset - UEObject.fieldNextOffset;
                        while ((fField = Memory.ReadProcessMemory<nint>(fField + UEObject.fieldNextOffset)) > 0)
                        {
                            var pName = UEObject.GetName(Memory.ReadProcessMemory<int>(fField + UEObject.fieldNameOffset));
                            var pType = obj.GetFieldType(fField);
                            pType = GetTypeFromFieldAddr("", pType, fField, out _);
                            func.Params.Add(new Package.SDKClass.SDKFields { Name = pName, Type = pType });
                        }

                        sdkClass.Functions.Add(func);
                    }
                }

                sdkPackage.Classes.Add(sdkClass);
            }

            dumpedPackages.Add(sdkPackage);
        }

        foreach (var p in dumpedPackages)
        {
            p.Dependencies = new List<Package>();
            foreach (var c in p.Classes)
            {
                {
                    var fromPackage = dumpedPackages.Find(tp => tp.Classes.Count(tc => tc.Name == c.Parent) > 0);
                    if (fromPackage != null && fromPackage != p && !p.Dependencies.Contains(fromPackage)) p.Dependencies.Add(fromPackage);
                }
                foreach (var f in c.Fields)
                {
                    var fromPackage = dumpedPackages.Find(tp => tp.Classes.Count(tc => tc.Name == f.Type?.Replace("Array<", "").Replace(">", "")) > 0);
                    if (fromPackage != null && fromPackage != p && !p.Dependencies.Contains(fromPackage)) p.Dependencies.Add(fromPackage);
                }

                foreach (var f in c.Functions)
                {
                    foreach (var param in f.Params)
                    {
                        var fromPackage = dumpedPackages.Find(tp => tp.Classes.Count(tc => tc.Name == param.Type?.Replace("Array<", "").Replace(">", "")) > 0);
                        if (fromPackage != null && fromPackage != p && !p.Dependencies.Contains(fromPackage)) p.Dependencies.Add(fromPackage);
                    }
                }
            }
        }

        foreach (var p in dumpedPackages)
        {
            var sb = new StringBuilder();
            sb.AppendLine("using UnrealSharp;");
            sb.AppendLine("using Object = UnrealSharp.UEObject;");
            sb.AppendLine("using Guid = SDK.Script.CoreUObjectSDK.Guid;");
            sb.AppendLine("using Enum = SDK.Script.CoreUObjectSDK.Enum;");
            sb.AppendLine("using DateTime = SDK.Script.CoreUObjectSDK.DateTime;");
            foreach (var d in p.Dependencies) sb.AppendLine("using SDK" + d.FullName.Replace("/", ".") + "SDK;");
            sb.AppendLine("namespace SDK" + p.FullName.Replace("/", ".") + "SDK");
            sb.AppendLine("{");
            var printedClasses = 0;
            foreach (var c in p.Classes)
            {
                if (c.Fields.Count > 0) printedClasses++;
                // sb.AppendLine("    [Namespace(\"" + c.Namespace + "\")]");
                sb.AppendLine("    public " + c.SdkType + " " + c.Name + ((c.Parent == null) ? "" : (" : " + c.Parent)));
                sb.AppendLine("    {");
                if (c.SdkType != "enum")
                    sb.AppendLine("        public " + c.Name + "(nint addr) : base(addr) { }");
                foreach (var f in c.Fields)
                {
                    if (f.Name == "RelatedPlayerState") continue; // todo fix
                    if (c.SdkType == "enum")
                        sb.AppendLine("        " + f.Name + " = " + f.EnumVal + ",");
                    else
                        sb.AppendLine("        public " + f.Type + " " + f.Name + " " + f.GetterSetter);
                }

                foreach (var f in c.Functions)
                {
                    if (f.Name == "ClientReceiveLocalizedMessage") continue; // todo fix
                    var returnType = f.Params.FirstOrDefault(pa => pa.Name == "ReturnValue")?.Type ?? "void";
                    var parameters = string.Join(", ", f.Params.FindAll(pa => pa.Name != "ReturnValue").Select(pa => pa.Type + " " + pa.Name));
                    var args = f.Params.FindAll(pa => pa.Name != "ReturnValue").Select(pa => pa.Name).ToList();
                    args.Insert(0, "nameof(" + f.Name + ")");
                    var argList = string.Join(", ", args);
                    var returnTypeTemplate = returnType == "void" ? "" : ("<" + returnType + ">");
                    sb.AppendLine("        public " + returnType + " " + f.Name + "(" + parameters + ") { " + (returnType == "void" ? "" : "return ") +
                                  "Invoke" + returnTypeTemplate + "(" + argList + "); }");
                }

                sb.AppendLine("    }");
            }

            sb.AppendLine("}");
            if (printedClasses == 0)
                continue;
            File.WriteAllText(location + @"\" + p.Name + ".cs", sb.ToString());
        }
    }
}
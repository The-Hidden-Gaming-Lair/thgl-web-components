using System.Text.Json.Serialization;

namespace NativeGameEvents.Models
{
    public class Actor
    {
        public nint address;
        public string type;
        public float x;
        public float y;
        public override string ToString()
        {
            return address.GetHashCode() + "|" + type + "|" + x + "|" + y;
        }
    }
}

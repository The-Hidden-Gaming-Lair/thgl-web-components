using System.Text.Json.Serialization;

namespace NativeGameEvents.Models
{
    public class Actor
    {
        public string type;
        public float x;
        public float y;
        public override string ToString()
        {
            return type + "|" + x + "|" + y;
        }
    }
}

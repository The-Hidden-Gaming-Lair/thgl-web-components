using System.Globalization;
using System.Text.Json.Serialization;


namespace NativeGameEvents.Models
{
  public class Actor
  {
    public nint address;
    public string type;
    public float x;
    public float y;
    public float z;
    public bool hidden;
    public string path;
    public override string ToString()
    {
      return address + "|" + type + "|" + x.ToString().Replace(',', '.') + "|" + y.ToString().Replace(',', '.') + "|" + z.ToString().Replace(',', '.') + "|" + hidden.ToString() + "|" + path;
    }
  }
}

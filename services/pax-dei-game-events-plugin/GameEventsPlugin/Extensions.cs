namespace GameEventsPlugin
{
  public static class Extensions
  {
    public struct Vector3Double
    {
      public double X;
      public double Y;
      public double Z;

      public Vector3Double(double x, double y, double z)
      {
        X = x;
        Y = y;
        Z = z;
      }
    }

    public struct Rotator
    {
      public double Pitch;
      public double Yaw;
      public double Roll;

      public Rotator(double pitch, double yaw, double roll)
      {
        Pitch = pitch;
        Yaw = yaw;
        Roll = roll;
      }
    }
  }
}
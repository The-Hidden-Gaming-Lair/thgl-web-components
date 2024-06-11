namespace GameEventsPlugin
{
  public static class Extensions
  {
    public struct Rotator
    {
      public float Pitch;
      public float Yaw;
      public float Roll;

      public Rotator(float pitch, float yaw, float roll)
      {
        Pitch = pitch;
        Yaw = yaw;
        Roll = roll;
      }
    }
  }
}
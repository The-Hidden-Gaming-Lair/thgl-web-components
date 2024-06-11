using Tracker.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using static Tracker.Extensions;
using UCheck;

namespace Tracker.Actions
{
  public class Actors
  {
    static public Actor GetActorPlayer(UEObject owningGameInstance)
    {
      var localPlayers = owningGameInstance["LocalPlayers"];
      var localPlayer = localPlayers[0];
      var playerController = localPlayer["PlayerController"];
      var acknowledgedPawn = playerController["AcknowledgedPawn"];
      var type = acknowledgedPawn.GetName();
      var path = acknowledgedPawn.ClassName;
      return GetActor(acknowledgedPawn, type, path);
    }

    static public Actor GetActor(UEObject actor, String type, String path)
    {
      var rootComponent = actor["RootComponent"];
      if (rootComponent == null)
      {
        throw new Exception("Actor is not available");
      }
      var relativeLocation = rootComponent["RelativeLocation"];
      if (relativeLocation == null)
      {
        throw new Exception("RelativeLocation is not available");
      }
      var position = UnrealEngine.Memory.ReadProcessMemory<Vector3Double>(relativeLocation.Address);

      var relativeRotation = rootComponent["RelativeRotation"];
      var rotation = UnrealEngine.Memory.ReadProcessMemory<Rotator>(relativeRotation.Address);
      var r = rotation.Yaw;
      var hidden = false;
      if (type == "BP_CodexActor_C")
      {
        var bHasBeenGranted = actor["bHasBeenGranted"];
        if (bHasBeenGranted.Flag)
        {
          hidden = true;
        }
      }

      return new Actor()
      {
        address = actor.Address.ToInt64(),
        type = type,
        x = position.X,
        y = position.Y,
        z = position.Z,
        r = r,
        hidden = hidden,
        path = path
      };
    }

    static public List<Actor> GetActors(UEObject levels, string[] types)
    {
      var actors = new List<Actor>();
      try
      {
        var path = levels[0].ClassName;

        for (var l = 0; l < levels.Num; l++)
        {
          var Level = levels[l];
          var actorsAddress = Level.Address + (l == 0 ? 0xA8 : 0x98);
          var Actors = new UEObject(actorsAddress);
          var actorsNum = Actors.Num;
          for (var i = 0; i < actorsNum; i++)
          {
            try
            {
              var actor = Actors[i];
              string type;
              var staticMesh = actor["InstancedStaticMeshComponent"]?["StaticMesh"];
              if (staticMesh != null)
              {
                type = staticMesh.ClassName.Split('/').Last().Split('.').First();
              }
              else
              {
                type = actor.GetName();
              }

              if (types.Length == 0 || types.Contains(type))
              {
                actors.Add(GetActor(actor, type, path));
              }
            }
            catch (Exception e)
            {
              //
            }
          }
        }
      }
      catch (Exception e)
      {
        //
      }
      return actors;
    }
  }
}

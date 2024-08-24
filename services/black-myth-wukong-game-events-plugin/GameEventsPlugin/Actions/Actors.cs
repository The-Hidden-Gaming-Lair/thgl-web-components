using GameEventsPlugin.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Numerics;
using static GameEventsPlugin.Extensions;

namespace GameEventsPlugin.Actions
{
  public class Actors
  {
    static public Actor? GetActorPlayer(UEObject owningGameInstance)
    {
      var localPlayers = owningGameInstance["LocalPlayers"];
      var localPlayer = localPlayers[0];
      if (localPlayer == null)
      {
        throw new Exception("Can not find LocalPlayer");
      }
      var playerController = localPlayer["PlayerController"];
      if (playerController == null)
      {
        throw new Exception("Can not find PlayerController");
      }
      var acknowledgedPawn = playerController["AcknowledgedPawn"];
      if (acknowledgedPawn == null)
      {
        throw new Exception("Can not find AcknowledgedPawn");
      }
      var type = acknowledgedPawn.GetName();
      var path = acknowledgedPawn.ClassName;
      return GetActor(acknowledgedPawn, type, path);
    }

    static public Actor? GetActor(UEObject actor, String type, String path)
    {
      var rootComponent = actor["RootComponent"];
      if (rootComponent == null)
      {
        return null;
      }
      var relativeLocation = rootComponent["RelativeLocation"];
      if (relativeLocation == null)
      {
        return null;
      }
      var position = UnrealEngine.Memory.ReadProcessMemory<Vector3Double>(relativeLocation.Address);
      if (position.X == 0 && position.Y == 0)
      {
        return null;
      }
      var relativeRotation = rootComponent["RelativeRotation"];
      var rotation = UnrealEngine.Memory.ReadProcessMemory<Rotator>(relativeRotation.Address);
      var r = rotation.Yaw;
      var hidden = false;

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
        if (levels.Num == 0)
        {
          return actors;
        }
        var path = levels[0].ClassName;

        for (var l = 0; l < levels.Num; l++)
        {
          var Level = levels[l];
          var className = Level.ClassName;
          var actorsAddress = Level.Address + (l == 0 ? 0xA8 : 0x98);
          var Actors = new UEObject(actorsAddress);
          var actorsNum = Actors.Num;
          if (actorsNum >= 65536)
          {
            continue;
          }
          for (var i = 0; i < actorsNum; i++)
          {
            try
            {
              var actor = Actors[i];
              string type = actor.GetName();
              var staticMesh = actor["InstancedStaticMeshComponent"]?["StaticMesh"] ?? actor["StaticMesh"] ?? actor["StaticMeshComponent"];
              if (staticMesh != null)
              {
                type = staticMesh.ClassName.Split('/').Last().Split('.').First();
              }
              else
              {
                type = actor.GetName();
              }

              if (types.Length == 0 || types.Contains(type, StringComparer.OrdinalIgnoreCase))
              {
                var foundActor = GetActor(actor, type, path);
                if (foundActor != null)
                {
                  actors.Add((Actor)foundActor);

                }
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

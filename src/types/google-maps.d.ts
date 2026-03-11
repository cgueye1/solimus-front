// types/google-maps.d.ts
declare namespace google {
  namespace maps {
    namespace places {
      class AutocompleteService {
        getPlacePredictions(request: any, callback: any): void;
      }
      
      class PlacesService {
        constructor(element: any);
        findPlaceFromQuery(request: any, callback: any): void;
      }
    }
    
    class Geocoder {
      geocode(request: any, callback: any): void;
    }
    
    class Map {
      constructor(element: any, options: any);
      setCenter(location: any): void;
      setZoom(zoom: number): void;
      addListener(event: string, handler: any): void;
    }
    
    class Marker {
      constructor(options: any);
      setMap(map: any): void;
      getPosition(): any;
      addListener(event: string, handler: any): void;
    }
    
    class LatLng {
      lat(): number;
      lng(): number;
    }
    
    const Animation: {
      DROP: any;
    };
    
    const MapTypeControlStyle: any;
    const MapTypeId: any;
  }
}
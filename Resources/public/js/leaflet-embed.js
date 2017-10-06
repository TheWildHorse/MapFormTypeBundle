/**
 * Leaflet implementation for the Map FormType
 *
 * @date   05/10/2017
 * @author webber <webber.nl@gmail.com>
 * @author j63 <jwoudstr@gmail.com>
 */

var CuriousMap = function (lat, long, fieldIds) {
  this.lat = lat;
  this.long = long;
  this.mapId = fieldIds.mapId;
  this.latId = fieldIds.latId;
  this.longId = fieldIds.longId;
  this.currentLocationId = fieldIds.currentLocationId;

  // set up the map
  this.map = new L.Map(this.mapId);

  // create the tile layer with correct attribution
  var osmUrl = 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  var osmAttrib = 'Map data © <a href="http://openstreetmap.org">OpenStreetMap</a> contributors';
  var osm = new L.TileLayer(osmUrl, {minZoom: 8, maxZoom: 22, attribution: osmAttrib});

  // start the map in a given location
  this.map.setView(new L.LatLng(this.lat, this.long), 9);
  this.map.addLayer(osm);

  // Add marker
  this.marker = this.addMarker();

  // Set form fields
  this.setMarkerFormFields();

  var $this = this;
  L.Control.geocoder({
    defaultMarkGeocode: false
  }).on('markgeocode', function(e) {
    var new_position = e.geocode.center;
    $this.updateMap(new_position);
    $this.setMarkerFormFields();
  }).addTo($this.map);

  this.marker.on('dragend', function(){
    var position = $this.marker.getLatLng();
    $this.marker.setLatLng(new L.LatLng(position.lat, position.lng),{draggable:'true'});
    $this.map.panTo(new L.LatLng(position.lat, position.lng));
    $this.setMarkerFormFields();
  });

  $(this.latId + "," + this.longId).change(function(){
    var new_position = new L.LatLng($($this.latId).val(),  $($this.longId).val());
    $this.updateMap(new_position);
  });

  $(this.currentLocationId).click(function() {
    $this.map.on('locationfound', function(e){
      var new_position = e.latlng;
      $this.updateMap(new_position);
      $this.setMarkerFormFields();
    });
    $this.map.locate({setView: false});
  });
};

CuriousMap.prototype.addMarker = function() {
  return L.marker([this.lat, this.long],{draggable:'true'}).addTo(this.map);
};

CuriousMap.prototype.updateMap = function(newPosition) {
  this.marker.setLatLng(newPosition, {draggable: 'true'});
  this.map.flyTo(newPosition, 17, {duration: 0.7});
};

CuriousMap.prototype.setMarkerFormFields = function() {
  $(this.latId).attr("value", this.marker.getLatLng().lat);
  $(this.longId).attr("value", this.marker.getLatLng().lng);
};


$(document).ready(function() {
  var coordinate = {
    lat: 54.2623429,
    long: 6.791819799999985
  };
  var fieldIds = {
    mapId: $mapId,
    latId: $latId,
    longId: $longId,
    currentLocationId: $currentLocationId
  };
  var leafletMap = new CuriousMap(coordinate.lat, coordinate.long, fieldIds);
});

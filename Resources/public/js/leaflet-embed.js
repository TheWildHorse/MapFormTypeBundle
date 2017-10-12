/**
 * Leaflet implementation for the Map FormType
 *
 * @date   05/10/2017
 * @author webber <webber.nl@gmail.com>
 * @author j63 <jwoudstr@gmail.com>
 */

var CuriousMap = function(options) {
  var $this = this;

  // Defaults
  this.lat = options.latitude;
  this.long = options.longitude;
  this.zoom = options.zoom;
  this.mapId = options.mapId;

  // Defined input ids
  var idPrefix = options.fieldId.id;
  this.currentLocationId = '#' + idPrefix + '_location_snap';
  this.searchAddressInputId = '#' + idPrefix + '_location_search_input';
  this.searchButtonId = '#' + idPrefix + '_location_search_btn';
  $(this.searchAddressInputId).focus();

  // Configured input ids based on allowed fields in MapType class
  this.inputIds = {};
  this.inputIds.latitude = getFieldId(options, 'latitude', idPrefix);
  this.inputIds.longitude = getFieldId(options, 'longitude', idPrefix);
  this.inputIds.address = getFieldId(options, 'address', idPrefix);
  this.inputIds.street = getFieldId(options, 'street', idPrefix);
  this.inputIds.postal_code = getFieldId(options, 'postal_code', idPrefix);
  this.inputIds.city = getFieldId(options, 'city', idPrefix);
  this.inputIds.city_district = getFieldId(options, 'city_district', idPrefix);
  this.inputIds.city_neighbourhood = getFieldId(options, 'city_neighbourhood', idPrefix);
  this.inputIds.state = getFieldId(options, 'state', idPrefix);
  this.inputIds.country = getFieldId(options, 'country', idPrefix);

  // Set up the map
  this.map = new L.Map(this.mapId);
  this.map.on('locationfound', function(e) {
    var position = e.latlng;
    this.updatePosition(position);
    this.updateMap(position);
    this.setMarkerFormFields();
  });

  // Create the tile layer with correct attribution
  var osmUrl = 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  var osmAttrib = 'Map data © <a href="http://openstreetmap.org">OpenStreetMap</a> contributors';
  var osm = new L.TileLayer(osmUrl, {minZoom: 1, maxZoom: 20, attribution: osmAttrib});

  // Start the map in a given location
  this.map.setView(new L.LatLng(this.lat, this.long), this.zoom);
  this.map.addLayer(osm);

  // Add marker
  this.marker = this.addMarker();

  // Set form fields
  this.setMarkerFormFields();
  this.marker.on('dragend', function() {
    var position = $this.marker.getLatLng();
    $this.updatePosition(position);
    $this.updateMap(position);
    populateInputs(position);
  });

  // Have the enter key submit the search instead of the form
  $(document).on('keydown', this.searchAddressInputId, function(event) {
    if (event.keyCode === 13) {
      event.preventDefault();
      $($this.searchButtonId).click();
      return false;
    }
  });

  // Snap to location action
  $(document).on('click', this.currentLocationId, function() {
    $this.map.locate({setView: false});
  });

  // Search address from user-provided input
  $(document).on('click', this.searchButtonId, function() {
    var addressString = $(this).closest('div').find('input').val();
    $.getJSON('https://nominatim.openstreetmap.org/search?format=json&limit=1&&q=' + addressString, function(data) {
      if (data.length !== 0) {
        var details = data[0];
        var position = new L.LatLng(details.lat, details.lon);
        $this.updatePosition(position);
        $this.updateMap(position);
        populateInputs(position);

        // Zoom to appropriate level
        $this.map.setZoom(zoomByType(details.type));
      }
    });
  });

  // Populate the configured fields
  function populateInputs(position) {
    $.getJSON('https://nominatim.openstreetmap.org/reverse?lat=' + position.lat + '&lon=' + position.lng + '&zoom=18&addressdetails=1&limit=1&format=json', function(data) {
      // Update the values that are always present
      $($this.inputIds.latitude).val(position.lat);
      $($this.inputIds.longitude).val(position.lng);

      // Update additional address data
      if (data.length !== 0 && typeof data.address !== 'undefined') {

        // Determine city district information
        var district = data.address.suburb;
        if (data.address.suburb === data.address.city && typeof data.address.residential !== 'undefined') {
          district = data.address.residential;
        } else if (data.address.suburb === data.address.city && typeof data.address.industrial !== 'undefined') {
          district = data.address.industrial;
        }

        // Populate the actual fields
        $($this.inputIds.address).val(data.display_name);
        $($this.inputIds.street).val(data.address.road);
        $($this.inputIds.postal_code).val(data.address.postcode);
        $($this.inputIds.city).val(data.address.city);
        $($this.inputIds.city_district).val(district);
        $($this.inputIds.city_neighbourhood).val(data.address.neighbourhood);
        $($this.inputIds.state).val(data.address.state);
        $($this.inputIds.country).val(data.address.country);
      }
    });
  }

  // Generate dynamically configured input field ids
  function getFieldId(options, requestedFieldName, idPrefix) {
    var fieldId;
    if (typeof options.fields[requestedFieldName] !== 'undefined') {
      if (typeof options.fields[requestedFieldName].name !== 'undefined') {
        fieldId = '#' + idPrefix + '_' + options.fields[requestedFieldName].name;
      } else {
        fieldId = '#' + idPrefix + '_' + requestedFieldName;
      }
    }
    return fieldId;
  }

  // Determine appropriate zoomlevel for our map
  function zoomByType(type) {
    var zoom;
    if (type === 'house') {
      zoom = 18;
    } else if (type === 'neighbourhood') {
      zoom = 16
    } else if (type === 'city') {
      zoom = 13
    } else if (type === 'administrative') {
      zoom = 11
    } else {
      zoom = 8
    }
    return zoom;
  }

};

// Create a marker to add to our map
CuriousMap.prototype.addMarker = function() {
  return L.marker([this.lat, this.long], {draggable: 'true'}).addTo(this.map);
};

// Update this model's position information
CuriousMap.prototype.updatePosition = function(position) {
  this.lat = position.lat;
  this.long = position.lng;
};

// Update the marker and map location
CuriousMap.prototype.updateMap = function(position) {
  this.marker.setLatLng(position, {draggable: 'true'});
  this.map.panTo(position);
};

// Populate the lat and long fields (defaults)
CuriousMap.prototype.setMarkerFormFields = function() {
  var position = this.marker.getLatLng();
  $(this.inputIds.latitude).val(position.lat);
  $(this.inputIds.longitude).val(position.lng);
};

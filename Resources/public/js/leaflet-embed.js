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

  // Configured elements
  var formIdPrefix = options.fieldId;
  this.initialiseFormFields(options.fields, formIdPrefix);

  // Templated element ids
  this.snapButtonId = '#' + formIdPrefix + '_location_snap';
  this.searchAddressInputId = '#' + formIdPrefix + '_location_search_input';
  this.searchButtonId = '#' + formIdPrefix + '_location_search_btn';
  $(this.searchAddressInputId).focus();

  // Set up the map
  this.map = new L.Map(this.mapId);
  this.map.on('locationfound', this.mapLocationFound);

  // Create the tile layer with correct attribution
  var osmUrl = 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  var osmAttrib = 'Map data © <a href="http://openstreetmap.org">OpenStreetMap</a> contributors';
  var osm = new L.TileLayer(osmUrl, {minZoom: 1, maxZoom: 20, attribution: osmAttrib});

  // Start the map in a given location
  this.map.setView(new L.LatLng(this.lat, this.long), this.zoom);
  this.map.addLayer(osm);

  // Add marker
  this.marker = L.marker([this.lat, this.long], {draggable: 'true'}).addTo(this.map);
  this.marker.on('dragend', function() {
    $this.updateMap(this.getLatLng());
  });

  // Have the enter key submit the search instead of the form
  $(document).on('keydown', this.searchAddressInputId, function(e) {
    if (e.keyCode === 13) {
      e.preventDefault();
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
        $this.updateMap(position);

        // Zoom to appropriate level
        $this.map.setZoom($this.determineZoomLevel(details.type));
      }
    });
  });
};

/**
 * Update the marker and map location
 *
 * @param position
 */
CuriousMap.prototype.updateMap = function(position) {
  this.lat = position.lat;
  this.long = position.lng;
  this.marker.setLatLng(position, {draggable: 'true'});
  this.map.panTo(position);
  this.updateFormFields(position);
};

/**
 * Perform a reverse lookup for the provided position
 * in order to retrieve address information and update
 * the related form fields.
 *
 * @param position
 */
CuriousMap.prototype.updateFormFields = function(position) {
  var $this = this;

  $.getJSON('https://nominatim.openstreetmap.org/reverse?lat=' + position.lat + '&lon=' + position.lng + '&zoom=18&addressdetails=1&limit=1&format=json', function(data) {
    // Update the values that are always present
    $this.fields.latitude.$field.val(position.lat);
    $this.fields.longitude.$field.val(position.lng);

    // Update additional address data
    if (data.length !== 0 && typeof data.address !== 'undefined') {

      // Populate the actual fields
      if ($this.fields.address !== undefined) {
        $this.fields.address.$field.val(data.display_name);
      }
      if ($this.fields.street !== undefined) {
        $this.fields.street.$field.val(data.address.road);
      }
      if ($this.fields.postal_code !== undefined) {
        $this.fields.postal_code.$field.val(data.address.postcode);
      }
      if ($this.fields.city !== undefined) {
        var city = data.address.city;
        if (typeof data.address.town !== 'undefined') {
          city = data.address.town;
        } else if (typeof data.address.village !== 'undefined') {
          city = data.address.village;
        }
        $this.fields.city.$field.val(city);
      }
      if ($this.fields.city_district !== undefined) {
        var district = data.address.suburb;
        if (typeof data.address.residential !== 'undefined') {
          district = data.address.residential;
        } else if (typeof data.address.industrial !== 'undefined') {
          district = data.address.industrial;
        }
        $this.fields.city_district.$field.val(district);
      }
      if ($this.fields.city_neighbourhood !== undefined) {
        $this.fields.city_neighbourhood.$field.val(data.address.neighbourhood);
      }
      if ($this.fields.state !== undefined) {
        $this.fields.state.$field.val(data.address.state);
      }
      if ($this.fields.country !== undefined) {
        $this.fields.country.$field.val(data.address.country);
      }
    }
  });
};

/**
 * Format the form fields array to contain
 * - our internal input field name as key
 * - optionally defined field name
 * - jquery field selector
 *
 * @param fields
 * @param formIdPrefix
 */
CuriousMap.prototype.initialiseFormFields = function(fields, formIdPrefix) {
  var $this = this;

  $this.fields = {};
  $.each(fields, function(name, options) {
    if (options.name === undefined) {
      options.name = name;
    }

    options.$field = $(`#${formIdPrefix}_${options.name}`);
    $this.fields[name] = options;
  });
};

/**
 * Determine appropriate zoomlevel based on information type
 *
 * @param type
 * @returns int
 */
CuriousMap.prototype.determineZoomLevel = function(type) {
  console.log(type);

  var level;
  if (type === 'house' || type === 'residential') {
    level = 18;
  } else if (type === 'neighbourhood') {
    level = 16
  } else if (type === 'city') {
    level = 13
  } else if (type === 'administrative') {
    level = 11
  } else {
    level = 8
  }
  return level;
};

/**
 * Leaflet implementation for the Map FormType
 *
 * @date   05/10/2017
 * @author webber <webber.nl@gmail.com>
 * @author j63 <jwoudstr@gmail.com>
 */
var CuriousMap = function (options) {
  // Object variables
  this.formId = options.formId;
  this.lat = options.latitude;
  this.long = options.longitude;
  this.zoom = options.zoom;
  this.mapId = options.mapId;

  // Initialise Map
  this.map = new L.Map(this.mapId);
  var osmUrl = 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  var osmAttrib = 'Map data © <a href="http://openstreetmap.org">OpenStreetMap</a> contributors';
  var osm = new L.TileLayer(osmUrl, { minZoom: 1, maxZoom: 20, attribution: osmAttrib });
  this.map.addLayer(osm);
  this.map.setView(new L.LatLng(this.lat, this.long), this.zoom);
  this.updateMarker();

  // Initialise CuriousMap
  this.initialiseSearchFields();
  this.initialiseFormFields(options.fields);
  this.initialiseTriggers();
  this.focus();
};

/**
 * Update the marker and map location
 *
 * @param position
 */
CuriousMap.prototype.updateLocation = function (position) {
  this.lat = position.lat;
  this.long = position.lng;
  this.$marker.setLatLng(position, { draggable: 'true' });
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
CuriousMap.prototype.updateFormFields = function (position) {
  var $this = this;

  this.clearFormFields();

  $.getJSON('https://nominatim.openstreetmap.org/reverse?lat=' + position.lat + '&lon=' + position.lng + '&zoom=18&addressdetails=1&limit=1&format=json', function (data) {
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
 * Clear all associated form fields
 */
CuriousMap.prototype.clearFormFields = function () {
  var $this = this;

  $.each($this.fields, function (name, field) {
    field.$field.val('');
  });
};

/**
 * Initialise search fields
 */
CuriousMap.prototype.initialiseSearchFields = function () {
  this.$snapCurrent = $(`#${this.formId}_location_snap`);
  this.$searchField = $(`#${this.formId}_location_search_input`);
  this.$searchBtn = $(`#${this.formId}_location_search_btn`);
};

/**
 * Link the form fields to this object
 */
CuriousMap.prototype.initialiseFormFields = function (fields) {
  var $this = this;

  $this.fields = {};
  $.each(fields, function (name, options) {
    if (options.name === undefined) {
      options.name = name;
    }

    options.$field = $(`#${$this.formId}_${options.name}`);
    $this.fields[name] = options;
  });
};

/**
 * Initialise triggers
 */
CuriousMap.prototype.initialiseTriggers = function () {
  var $this = this;

  // SnapToLocation button trigger
  if (undefined !== this.$snapCurrent) {
    this.$snapCurrent.on('click', function () {
      $this.onSnapToLocationPressed();
    });
  }

  // Dropping the marker somewhere on the map
  this.$marker.on('dragend', function () {
    $this.updateLocation(this.getLatLng());
  });

  // Enter in searchField
  this.$searchField.on('keydown', function (e) {
    if (e.keyCode === 13) {
      e.preventDefault();
      $this.searchAddress($(this).val());
    }
  });

  // Search button pressed
  this.$searchBtn.on('click', function () {
    $this.searchAddress($this.$searchField.val());
  });
};

/**
 * Update the marker according to current latitude and longitude
 */
CuriousMap.prototype.updateMarker = function () {
  this.$marker = L.marker([this.lat, this.long], { draggable: 'true' }).addTo(this.map);
};

CuriousMap.prototype.searchAddress = function (address) {
  var $this = this;

  $.getJSON('https://nominatim.openstreetmap.org/search?format=json&limit=1&q=' + address, function (data) {
    if (data.length) {
      var details = data[0];
      var position = new L.LatLng(details.lat, details.lon);
      $this.updateLocation(position);
      $this.map.setZoom($this.determineZoomLevel(details.type));
    }
  });
};

/**
 * Determine appropriate zoom-level based on information type
 */
CuriousMap.prototype.determineZoomLevel = function (type) {
  var level;
  if (type === 'house' || type === 'residential') {
    level = 18;
  } else if (type === 'neighbourhood') {
    level = 16;
  } else if (type === 'city') {
    level = 13;
  } else if (type === 'administrative') {
    level = 11;
  } else {
    level = 8;
  }
  return level;
};

/**
 * Focus the searchField when focusing this object
 */
CuriousMap.prototype.focus = function () {
  this.$searchField.focus();
}

/**
 * EventHandler for when the SnapToCurrentLocation button is pressed
 */
CuriousMap.prototype.onSnapToLocationPressed = function () {
  var bootstrapJsIsLoaded = (typeof $().modal === 'function');

  if (window.location.protocol === 'https:') {
    // Locate device's location on the map
    this.map.locate({
      watch: true,
      enableHighAccuracy: true,
    });
  } else if (bootstrapJsIsLoaded) {
    // Show a warning that this functionality does not work over http
    var $modal = $(`#${this.formId}_modal`)
      .modal()
      .addClass('security')
      .find('.alert_no_secure_connection')
      .show();
  } else {
    // Fallback for when bootstrap is not loaded
    alert('For security reasons, location will not be retreived over an insecure connection');
  }
};

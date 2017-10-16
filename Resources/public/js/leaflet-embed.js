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
  this.mapId = this.formId + '_map';
  this.$modal = $(`#${this.formId}_modal`);

  // Set defaults
  this.lat = options.defaults.latitude;
  this.long = options.defaults.longitude;
  this.zoom = options.defaults.zoom;

  // Initialise Map
  this.map = new L.Map(this.mapId);
  this.initialiseBaseLayer(options.baseLayer);
  this.initialiseOverlays(options.overlays);

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
 * Add a layer
 */
CuriousMap.prototype.addLayer = function (settings) {
  var layer;

  if (settings.url === undefined) {
    // Do not process layer without url
  } else if (settings.type === 'TileLayer') {
    // Create TileLayer
    layer = this.createTileLayer(settings);
  } else {
    // Do not process unknown layerType
  }

  if (layer !== undefined) {
    this.map.addLayer(layer);
  }

  return layer;
};

/**
 * Create and return a TileLayer
 */
CuriousMap.prototype.createTileLayer = function (settings) {
  return new L.TileLayer(
    settings.url,
    {
      minZoom: settings.minZoom || 1,
      maxZoom: settings.maxZoom || 20,
      attribution: settings.attribution || '',
      subdomains: settings.subdomains || 'abc'
    }
  );
};

/**
 * Initialise the baseLayer
 */
CuriousMap.prototype.initialiseBaseLayer = function (settings) {
  var $this = this;

  if (settings.url === undefined || settings.type === undefined) {
    $(document).ready(function () {
      $this.$modal
        .modal()
        .attr('class', 'modal fade')
        .addClass('default')
        .find('.alert_no_base_layer')
        .show();
    });
  } else {
    this.addLayer(settings);
  }
};

/**
 * Initialise Overlays
 */
CuriousMap.prototype.initialiseOverlays = function (overlays) {
  var $this = this;

  // Add each overlay to the map
  $.each(overlays, function (name, overlay) {
    L.WMS.overlay(
      overlay.url,
      {
        layers: overlay.layers.join(),
        format: overlay.format || 'image/png',
        transparent: overlay.transparent || true
      }
    ).addTo($this.map);
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
      $this.snapToLocation();
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

/**
 * Search for an address
 */
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
};

/**
 * Snap to current location (HTTPS/Local only)
 */
CuriousMap.prototype.snapToLocation = function () {
  if (window.location.protocol === 'https:') {
    // Locate device's location on the map
    this.map.locate({
      watch: true,
      enableHighAccuracy: true
    });
  } else {
    // Show a warning that this functionality does not work over http
    this.$modal
      .modal()
      .attr('class', 'modal fade')
      .addClass('security')
      .find('.alert_no_secure_connection')
      .show();
  }
};

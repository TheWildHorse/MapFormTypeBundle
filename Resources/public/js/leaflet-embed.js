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
  this.$mapControl = L.control.layers();
  this.geoJsonLayerObjects = [];

  // Set defaults
  this.lat = options.defaults.latitude;
  this.lng = options.defaults.longitude;
  this.zoom = options.defaults.zoom;

  // Initialise
  this.initialise(options);
};

/*
 * Initialise CuriousMap
 */
CuriousMap.prototype.initialise = function (options) {
  // Initiate the Leaflet map
  this.$map = new L.Map(this.mapId);

  // Initialise CuriousMap FormType
  this.initialiseSearchFields();
  this.initialiseFormFields(options.fields);
  this.initialiseMapElements(options)
  this.initialiseTriggers();
  this.focus();
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

  if (this.fields.latitude) this.lat = this.fields.latitude.$field.val() || this.lat;
  if (this.fields.longitude) this.lng = this.fields.longitude.$field.val() || this.lng;
};

/*
 * Generate map elements
 */
CuriousMap.prototype.initialiseMapElements = function (options) {
  // Add Map Control to Map
  this.$mapControl.addTo(this.$map);

  // Set view
  this.$map.setView(new L.LatLng(this.lat, this.lng), this.zoom);

  // Set the initial marker
  this.initiateMarker();

  // Add all layers
  this.initialiseBaseLayers(options.baseLayers);
  this.initialiseOverlays(options.overlays);
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
 * Update the marker and map location
 */
CuriousMap.prototype.updateLocation = function (position) {
  // Set latitude and longitude from given position
  this.lat = position.lat;
  this.lng = position.lng;

  // Update all linked elements according to newly set coordinates
  this.$marker.setLatLng(position, { draggable: 'true' });
  this.$map.panTo(position);
  this.updateFormFields(position);
  this.updateGeoJsonLayers();
};

/**
 * Perform a reverse lookup for the provided position
 * in order to retrieve address information and update
 * the related form fields.
 */
CuriousMap.prototype.updateFormFields = function (position) {
  var $this = this;

  this.clearFormFields();

  $.getJSON('https://nominatim.openstreetmap.org/reverse?lat=' + position.lat + '&lon=' + position.lng + '&zoom=18&addressdetails=1&limit=1&format=json', function (data) {
    // Update the values that are always present
    if(data) {
      $this.fields.latitude.$field.val(data.lat || position.lat);
      $this.fields.longitude.$field.val(data.lon || position.lng);

      // Process address information
      if (data.address) {
        var houseNumber = data.address.house_number || '';
        var street = data.address.footway || data.address.road || '';
        var postCode = data.address.postcode || '';
        var city = data.address.village || data.address.town || data.address.city || '';
        var district = data.address.residential || data.address.industrial || data.address.district || data.address.suburb || '';
        var neighbourhood = data.address.neighbourhood || '';
        var state = data.address.province || data.address.state || '';
        var country = data.address.country || '';

        // Populate input fields if configured
        if ($this.fields.address) $this.fields.address.$field.val(street + ' ' + houseNumber + ', ' + city);
        if ($this.fields.street) $this.fields.street.$field.val(street);
        if ($this.fields.postal_code) $this.fields.postal_code.$field.val(postCode);
        if ($this.fields.city) $this.fields.city.$field.val(city);
        if ($this.fields.city_district) $this.fields.city_district.$field.val(district);
        if ($this.fields.city_neighbourhood) $this.fields.city_neighbourhood.$field.val(neighbourhood);
        if ($this.fields.state) $this.fields.state.$field.val(state);
        if ($this.fields.country) $this.fields.country.$field.val(country);
      }
    }
  });
};

/**
 * Update GeoJson-Layers with new data, according to the map's current boundaries
 */
CuriousMap.prototype.updateGeoJsonLayers = function () {
  var $this = this;

  var bbox = $this.$map.getBounds().toBBoxString();

  // Generate url to fetch GeoJson objects
  var generateUrl = function (settings) {
    var parameters = Object.assign(
      { bbox: bbox },
      settings.parameters
    );

    return settings.url + L.Util.getParamString(parameters);
  };

  // Go through each GeoJsonLayer Object
  $.each(this.geoJsonLayerObjects, function (index, geoJsonLayerObject) {
    // Update the layer within the object with new GeoJson data, if any
    var url = generateUrl(geoJsonLayerObject.settings);
    if (url) {
      $.ajax({
        jsonp: true,
        url: url,
        dataType: 'json',
        jsonpCallback: 'getJson',
        success: function (data) {
          geoJsonLayerObject.layer.addData(data);
        }
      });
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
 * Add baseLayer according to given definition
 */
CuriousMap.prototype.addBaseLayer = function (layerDefinition) {
  var layer;

  if (layerDefinition.url === undefined) {
    // Do not process layer without url
  } else if (layerDefinition.type === 'TileLayer') {
    layer = this.createTileLayer(layerDefinition);
  } else {
    // Do not process unknown layerType
  }

  // Add layer to the map, if any
  if (layer !== undefined) {
    this.addBaseLayerToControl(layerDefinition.group, layer);
    this.$map.addLayer(layer);
  }

  // Return the layer if any
  return layer;
};

/**
 * Add a layer to a group in the map control
 */
CuriousMap.prototype.addBaseLayerToControl = function (groupName, layer) {
  var baseLayerLabel = '<span class="base-layer-label">%s</span>';

  // Do not modify map control without groupName or layer to add.
  if (groupName === undefined || layer === undefined) {
    return;
  }

  // Update map control: Remove the modified group and then re-add
  this.$mapControl.removeLayer(layer);
  this.$mapControl.addBaseLayer(layer, baseLayerLabel.replace('%s', groupName));
};

CuriousMap.prototype.addOverlay = function (layerDefinition) {
  var layer;

  if (layerDefinition.url === undefined) {
    // Do not process layer without url
  } else if (layerDefinition.type === 'GeoJson' && layerDefinition.parameters !== undefined) {
    layer = this.createGeoJsonLayer(layerDefinition);
  } else if (layerDefinition.type === 'TileLayer') {
    layer = this.createTileLayer(layerDefinition);
  } else if (layerDefinition.type === 'WmsLayer') {
    layer = this.createWmsLayer(layerDefinition);
  } else {
    // Do not process unknown layerType
  }

  // Add layer to the map, if any
  if (layer !== undefined) {
    // Enable snapping to this layer's features, if snapping was set to true in its definition
    if (layerDefinition.snapping) {
      this.enableSnappingForLayer(layer);
    }
    // Add the layer to mapControl and to the map
    this.addOverlayToGroupInControl(layerDefinition.group, layer);
    this.$map.addLayer(layer);
  }

  return layer;
};

/**
 * Add overlay layers to $mapControl grouped by groupName
 */
CuriousMap.prototype.addOverlayToGroupInControl = function (groupName, layer) {
  var overlayLabel = '<span class="overlay-label">%s</span>';

  // Do not modify map control without groupName or layer to add.
  if (groupName === undefined || layer === undefined) {
    return;
  }

  // Add layer to group according to its groupName
  if (Object.prototype.hasOwnProperty.call(this.baseLayerGroups, groupName)) {
    this.baseLayerGroups[groupName].addLayer(layer);
  } else {
    this.baseLayerGroups[groupName] = new L.LayerGroup([layer]);
  }

  // Add the layer in its group, after removing the old group if it exists
  this.$mapControl.removeLayer(this.baseLayerGroups[groupName]);
  this.$mapControl.addOverlay(this.baseLayerGroups[groupName], overlayLabel.replace('%s', groupName));
};

/**
 * Create and return a Tile-Layer
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
 * Create and return a WMS-Layer
 */
CuriousMap.prototype.createWmsLayer = function (settings) {
  return L.WMS.overlay(
    settings.url,
    {
      layers: settings.layers.join(),
      format: settings.format || 'image/png',
      transparent: settings.transparent || true
    }
  );
};

/**
 * Create and return a GeoJsonLayer, and register it for updating on location change
 */
CuriousMap.prototype.createGeoJsonLayer = function (settings) {
  var $this = this;

  // Set style for circleMarkers if it has not been set
  this.geoJsonMarkerStyle = this.geoJsonMarkerStyle || {
    radius: 3,
    fillColor: '#ff7800',
    color: '#000',
    weight: 0.5,
    opacity: 1,
    fillOpacity: 0.8
  };

  // Create an empty geoJson layer
  var layer = L.geoJson(null, {
    pointToLayer: function (feature, location) {
      return L
        .circleMarker(location, $this.geoJsonMarkerStyle)
        .bindPopup(JSON.stringify(feature, location));
    }
  });

  // Add this layer and its metadata to the geoJsonLayerObjects list
  this.geoJsonLayerObjects.push({
    layer: layer,
    settings: settings
  });

  // Return the geoJsonLayer
  return layer;
};

/**
 * Initialise the baseLayers, according to given layerDefinitions
 */
CuriousMap.prototype.initialiseBaseLayers = function (layerDefinitions) {
  var $this = this;

  this.baseLayerGroups = {};

  // Go through each layerDefinition
  $.each(layerDefinitions, function (index, layerDefinition) {
    if (layerDefinition.url === undefined || layerDefinition.type === undefined) {
      // Warn the user when a base layer cannot be initialised
      $(document).ready(function () {
        $this.$modal
          .modal()
          .attr('class', 'modal fade')
          .addClass('default')
          .find('.alert_no_base_layer')
          .show();
      });
    } else {
      // Add the layer according to its definition
      $this.addBaseLayer(layerDefinition);
    }
  });
};

/**
 * Initialise Overlays, according to given layerDefinitions
 */
CuriousMap.prototype.initialiseOverlays = function (layerDefinitions) {
  var $this = this;

  this.overlayGroups = {};

  $.each(layerDefinitions, function (index, layerDefinition) {
    if (layerDefinition.url && layerDefinition.type) {
      $this.addOverlay(layerDefinition);
    }
  });
};

/**
 * Add a MapControl to the map (uses this.$mapControl by default)
 */
CuriousMap.prototype.addMapControl = function (control) {
  var mapControl = control || this.$mapControl;

  this.$mapControl = mapControl
    .layers()
    .addTo(this.$map);
};

/**
 * Update the marker according to current latitude and longitude
 */
CuriousMap.prototype.initiateMarker = function () {
  this.$marker = L.marker([this.lat, this.lng], { draggable: 'true' }).addTo(this.$map);
  this.$marker.snapediting = new L.Handler.MarkerSnap(this.$map, this.$marker);
};

/**
 * Enable snapping for given layer
 */
CuriousMap.prototype.enableSnappingForLayer = function (layer) {
  this.$marker.snapediting.addGuideLayer(layer);
  this.$marker.snapediting.enable();
};

/**
 * Search for an address
 */
CuriousMap.prototype.searchAddress = function (address) {
  var $this = this;

  var position;

  $.getJSON('https://nominatim.openstreetmap.org/search?format=json&limit=1&q=' + address, function (data) {
    if (data.length) {
      position = new L.LatLng(data[0].lat, data[0].lon);
      $this.updateLocation(position);
      $this.$map.setZoom($this.determineZoomLevel(data[0].type));
    }
  });
};

/**
 * Determine appropriate zoom-level based on information level-type (e.g. 'city') of a JSON response
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
 * Focus CuriousMap by focusing it's searchField, if any
 */
CuriousMap.prototype.focus = function () {
  if (this.$searchField) this.$searchField.focus();
};

/**
 * Snap to current location (HTTPS/Local only)
 */
CuriousMap.prototype.snapToLocation = function () {
  if (
    window.location.protocol === 'https:' ||
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1'
  ) {
    // Locate device's location on the map
    this.$map.locate({
      watch: true,
      enableHighAccuracy: true
    });
  } else {
    // Show a warning that this functionality does not work over http, unless origin is localhost
    this.$modal
      .modal()
      .attr('class', 'modal fade')
      .addClass('security')
      .find('.alert_no_secure_connection')
      .show();
  }
};

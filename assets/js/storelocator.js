/*jshint loopfunc: true*/
/*global google */
/*global Throbber */
/*global InfoBox */
/*global MarkerWithLabel */
/*global handleLocationError */
/*global trustedAssetsURL*/

var map, markerList, locations = [];
var infowindow;
var placeSearch, autocomplete;
var currentLatlng;
var requiredRegularSearch;
var componentForm = {
  street_number: 'short_name',
  route: 'long_name',
  locality: 'long_name',
  administrative_area_level_1: 'short_name',
  country: 'long_name',
  postal_code: 'short_name'
};
var locatorForm = document.getElementById('storelocator');
var brandDropdown = document.getElementById('brandselect');
var geoDetectButton = document.getElementById('currentLocationBtn');
var addressInput = document.getElementById('autocomplete');
var selectedOption = {
  'brand' : 'all-brands'
};
var endpoints = {
  'all' : '/webservices/store/storelist',
  'brandAll' : '/webservices/store/manufacturer/storelist/'
};
var webserviceUrl = endpoints.all;
var resultsVisible = false;

var throbber = Throbber({
  color: 'black',
  padding: 30,
  size: 32,
  fade: 200,
}).appendTo(document.getElementById('address-form-group'));

function initialize() {
  var defaultLat = 40.745812;
  var defaultLng = -100.913895;

  if (sessionStorageAvailable()) {
    window.onbeforeunload = function () {
      sessionStorage.setItem('Trusted.StoreLocator.Results', '');
      sessionStorage.setItem('Trusted.StoreLocator.CurrentMarker', '');
    };
  }

  brandDropdown.addEventListener('change', selectEndpoint);
  geoDetectButton.addEventListener('click', StoreLocator.DetectCurrentLocation);

  map = new google.maps.Map(document.getElementById('map'), {
      center: { lat: defaultLat, lng: defaultLng },
      zoom: 4,
      scrollwheel: false,
  });

  google.maps.event.addDomListener(window, 'resize', function() {
    StoreLocator.RefreshMap(true);
  });

  // Create the autocomplete object, restricting the search
  // to geographical location types.
  autocomplete = new google.maps.places.Autocomplete(
      /** @type {HTMLInputElement} */(document.getElementById('autocomplete')),
      { types: ['geocode'] });
  // When the user selects an address from the dropdown,
  // populate the address fields in the form.
  google.maps.event.addListener(autocomplete, 'place_changed', function() {
    fillInAddress();
    StoreLocator.LocationSearch(webserviceUrl);
  });

  $(locatorForm).bind('submit', function(e) {
    e.preventDefault();
    return false;
  });

  checkForParams();

}

function selectEndpoint() {
  var selection = brandDropdown.value;
  if (!selection.length || selection === 'all-brands') {
    selectedOption.brand = 'all-brands';
    webserviceUrl = endpoints.all;
  } else {
    webserviceUrl = endpoints.brandAll + selection;
  }
  if (resultsVisible) {
    StoreLocator.LocationSearch(webserviceUrl);
  }
}

// [START region_fillform]
function fillInAddress() {
  // Get the place details from the autocomplete object.
  var place = autocomplete.getPlace();
  if (typeof place.geometry === 'undefined') {
      StoreLocator.GetByRegularSearch(place.name);
  } else {
      currentLatlng = { 'lat': place.geometry.location.lat, 'lng': place.geometry.location.lng };
      for (var component in componentForm) {
        if (component !== undefined) {
          document.getElementById(component).value = '';
          document.getElementById(component).disabled = false;
        }
      }
      // Get each component of the address from the place details
      // and fill the corresponding field on the form.
      for (var i = 0; i < place.address_components.length; i++) {
          var addressType = place.address_components[i].types[0];
          if (componentForm[addressType]) {
              var val = place.address_components[i][componentForm[addressType]];
              document.getElementById(addressType).value = val;
          }
      }
  }
}
// [END region_fillform]

// [START region_geolocation]
// Bias the autocomplete object to the user's geographical location,
// as supplied by the browser's 'navigator.geolocation' object.
function geolocate() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function(position) {
      var geolocation = new google.maps.LatLng(
          position.coords.latitude, position.coords.longitude);
      var circle = new google.maps.Circle({
        center: geolocation,
        radius: position.coords.accuracy
      });
      autocomplete.setBounds(circle.getBounds());
    });
  }
}
// [END region_geolocation]

function sessionStorageAvailable() {
    try {
        return 'sessionStorage' in window && window.sessionStorage !== null;
    } catch(e) {
        return false;
    }
}

function checkForParams() {
  var passThruBrand = $.query.get('brand').toString();
  var passThruAddress = $.query.get('address').toString();

  if (passThruBrand.length) {
    $(brandDropdown).find('option').removeAttr('selected');
    $(brandDropdown).find('option[value='+passThruBrand+']').attr('selected',true);
    $(brandDropdown).trigger('change');
  }

  if (passThruAddress.length) {
    $(addressInput).val(passThruAddress);
  }

  if (passThruBrand.length || passThruAddress.length) {
    StoreLocator.GetByRegularSearch(passThruAddress);
  }

}

var StoreLocator = {
    LocationSearch: function (webserviceUrl, showLoaderBool) {
        var textCriteria = '';
        textCriteria = $('#autocomplete').val();
        var  addresstext = '';
        if (!showLoaderBool) {
          throbber.start();
        }
        if($('#street_number').val() !== '' ||  $('#route').val() !== '') {
            addresstext = $('#street_number').val() + ',' + $('#route').val();
        }
        $.ajax({
            type: 'GET',
            url: webserviceUrl,
            dataType: 'json',
            success: function (response) {
                var cleanResponse = [];

                for (var result = 0; result < response.length; result++) {
                  var calculatedMeter = StoreLocator.GetDistance(currentLatlng, {
                    'lat': response[result].latitude,
                    'lng': response[result].longitude
                  });
                  var validPlaceCond = (
                    response[result].latitude !== null ||
                    response[result].longitude !== null
                  );
                  if (validPlaceCond) {
                    response[result].metersAway = calculatedMeter;
                    cleanResponse.push(response[result]);
                  }
                }

                var distSortData = cleanResponse.sort(function(a, b) {
                  return a.metersAway - b.metersAway;
                });

                if (sessionStorageAvailable()) {
                  sessionStorage.setItem('Trusted.StoreLocator.Results', JSON.stringify(distSortData));
                }

                var completeHtml = [];
                for (var con = 0; con < cleanResponse.length; con++) {
                    completeHtml.push(StoreLocator.GenerateCard(cleanResponse[con], con));
                }

                var sortedHtmlString = '';
                for (var res = 0; res < completeHtml.length; res++) {
                  sortedHtmlString += completeHtml[res].templateCard.replace(/@@/g,'<div class="numberCircle">' + (res + 1) + '</div>');
                }

                if (cleanResponse.length > 0) {
                    $('#dvResult').html(sortedHtmlString);
                    StoreLocator.DrawMarker(distSortData);
                    $('.resultCard').click(function(e) {
                      $('.resultCard').removeClass('selected');
                      $(this).addClass('selected');
                      StoreLocator.OpenMarker($(this).attr('id') + '_' + 'details');
                    });
                    $('.resultCard').first().click();
                }
                else {
                    $('#dvResult').html(StoreLocator.NoResultTemplate());
                }
                StoreLocator.ShowList();
            },
            error: function (req, response) {
                console.log('Error:' + response);
            }
        });

        $('.google-map').height($('#dvResult').height());
        $('#dvResult').height($('.google-map').height());
    },
    RefreshMap: function(refreshBool) {
      if (sessionStorageAvailable() && refreshBool && resultsVisible) {
        var lastMarkerOpen = JSON.parse(sessionStorage.getItem('Trusted.StoreLocator.CurrentMarker'));
        map.setCenter(lastMarkerOpen.latLng);
      }
      google.maps.event.trigger(Map, 'resize');
    },
    SanitizeId: function(str) {
      return String(str).replace(/&/g, '_').replace(/</g, '_').replace(/>/g, '_').replace(/"/g, '_');
    },
    GenerateCard: function (item, idx) {
        //0 markerlabel
        //1 miles
        //2 assets/logo/Richard-Mille-logo.png
        //3 Richard Mille Boutique
        //4 9700 Collins Ave, Bal Harbour, FL 33154
        var cardNum = idx + 1;
        var calculatedmile = (item.metersAway / 1609.34).toFixed(2);
        var addressLine = item.address1 !== null && item.address2 !== null ? (item.address1 + '<br />' + item.address2) : (item.address1 || item.address2);
        var taddress = addressLine + '<br /> ' + item.city + ', ' + item.state + ' ' + item.zipCode;
        var itemID = StoreLocator.SanitizeId(item.brandUniqueName+'_'+item.locationUniqueName);
        var templateObj = {
          'templateCard' : '<div class="resultCard card span12" id="'+ itemID + '">' + '<div class="span3 nopadding">' +
          //Index when sorted
          '@@' +
          '    <div> <span class="miles">' + calculatedmile + ' mile(s)</span></div>' +
          '</div>' +
          '<div class="span9">' +
          '    <h1 class="title">' + item.retailerName + '</h1>' +
          '    <span class="desc">' + taddress + '</span><br />' +
          '    <a class="link" href="/stores/' + item.locationUniqueName  + '">Store Details</a>' +
          '</div>' +
          '</div>'
        };
                return templateObj;
    },
    CurrentMarker: function(id, latLng) {
      if (sessionStorageAvailable() && id && latLng) {
        var markerObj = {
          'id': id,
          'latLng': latLng
        };
        var currentMarkerString = JSON.stringify(markerObj);
        sessionStorage.setItem('Trusted.StoreLocator.CurrentMarker', currentMarkerString);
      }
    },
    OpenMarker :function(id){
        for (var mc = 0; mc < markerList.length; mc++) {
            if (markerList[mc].Id === id) {
                var markerLatLng = new google.maps.LatLng(markerList[mc].position.lat(), markerList[mc].position.lng());
                google.maps.event.trigger(markerList[mc], 'click');
                StoreLocator.CurrentMarker(id, markerLatLng);
                map.setZoom(11);
            }
        }
    },
    NoResultTemplate: function () {
        return '<div class="no-result"><p>No results found. Please refine you search criteria.</p></div>';
    },
    ShowList: function(){
        resultsVisible = true;
        $('#dvResult').show();
        $('.google-map').css('margin-left', $('#dvResult').width() + 'px');
        $('#map').width(window.innerWidth - $('#dvResult').width());
        throbber.stop();
    },
    HideList: function () {
        $('#dvResult').hide();
        $('.google-map').css('margin-left','');
    },
    DrawMarker: function (data) {
        markerList = [];
        locations = data;
        infowindow = new InfoBox({
            alignBottom: true,
            disableAutoPan: false,
            maxWidth: 450,
            pixelOffset: new google.maps.Size(-220, -205),
            zIndex: null,
            boxStyle: {
                // top arrow in the info window
                opacity: 0.9,
                width: '450px'
            },
            closeBoxMargin: '12px -36px 2px 2px',
            closeBoxURL: 'https://www.google.com/intl/en_us/mapfiles/close.gif', //close button icon
            infoBoxClearance: new google.maps.Size(10, 10)
        });
        var bounds = new google.maps.LatLngBounds();
        var marker;

        var image = {
            url: trustedAssetsURL + 'assets/images/marker.png',
            // This marker is 20 pixels wide by 32 pixels high.
            size: new google.maps.Size(40, 42),
            // The origin for this image is (0, 0).
            origin: new google.maps.Point(0, 0),
            // The anchor for this image is the base of the flagpole at (0, 32).
            anchor: new google.maps.Point(0, 32)
        };

        for (var i = 0; i < data.length; i++) {
            var retailer = data[i];
            var retailerId = StoreLocator.SanitizeId(retailer.brandUniqueName+'_'+retailer.locationUniqueName+'_details');
            var labelCharLength = (i+1).toString().length;
            var labelAnchorPos = labelCharLength > 1 ? new google.maps.Point(-14, 28) : new google.maps.Point(-18, 28) ;
            marker = new MarkerWithLabel({
                position: { lat: retailer.latitude, lng: retailer.longitude },
                map: map,
                icon: image,
                Id: retailerId,
                labelContent: i+1,
                labelAnchor: labelAnchorPos,
                labelClass: 'labels', // the CSS class for the label
                labelStyle: { opacity: 0.75 }
            });

            google.maps.event.addListener(marker, 'click', (function (marker, i) {
                return function () {
                    if (typeof marker === 'object' && typeof marker.Id === 'string') {
                      var markerResultId = marker.Id.replace('_details', '');
                      $('.resultCard.selected').removeClass('selected');
                      $('#'+markerResultId).addClass('selected');
                      //TODO add ScrollTo behavior to this result
                    }
                    var cards = $('.card');
                    var isLatLngFn = typeof currentLatlng.lat === 'function' && typeof currentLatlng.lng === 'function';
                    var currentLat = isLatLngFn ? currentLatlng.lat() : currentLatlng.lat;
                    var currentLng = isLatLngFn ? currentLatlng.lng() : currentLatlng.lng;
                    var localItem = locations[i];
                    $('#' + localItem.Id).addClass('selected');
                    var localaddress = $('#street_number').val() + $('#route').val() + ', ' + $('#locality').val() + ', ' + $('#administrative_area_level_1').val() + $('#postal_code').val();
                    var drivinglink = 'https://maps.google.com/?saddr=' + currentLat + ',' + currentLng + '&daddr=' + localItem.latitude + ',' + localItem.longitude;
                    var addressLine = localItem.address1 !== null && localItem.address2 !== null ? (localItem.address1 + '<br />' + localItem.address2) : (localItem.address1 || localItem.address2);
                    var logoArea = localItem.brandLogo !== null ? '<img src="' + $('#storeResultTemplate').find('img').attr('data-imgPath') + localItem.brandLogo + '" />'  : '';
                    var drivingDirections = '<a class="link" target="_blank" href="' + drivinglink + '">Driving Directions</a>';
                    var storePermalink = '<a class="link" target="_blank" href="/stores/' + localItem.locationUniqueName + '">View Store Details</a>';
                    infowindow.setContent('<div class="card info-card"><div class="span12 info-card-logo">' +
                     logoArea + '</div><div class="col-sm-7">' + ' <h1 class="title">' + localItem.retailerName+ '</h1>' +
                     ' <span class="desc">' + addressLine + '<br />'  + localItem.city + ', ' + localItem.state + ' ' + localItem.zipCode + '</span><br /></div>' +
                     '<div class="col-sm-5"><h1 class="title">Store Details</h1>' + storePermalink + '<br />' + drivingDirections  + '</div>');
                    infowindow.open(map, marker);
                    $('.gm-style-iw').next('div').remove();
                    //map.setCenter({ 'lat': localItem.latitude, 'lng': localItem.longitude });
                    map.setCenter(new google.maps.LatLng(localItem.latitude, localItem.longitude));
                };
            })(marker, i));
            map.setOptions({ maxZoom: 18 });
            bounds.extend(marker.position);
            markerList.push(marker); map.setCenter();
        }
    },
    DetectCurrentLocation: function () {
        if (navigator.geolocation) {
            throbber.start();
            navigator.geolocation.getCurrentPosition(function (position) {
                var pos = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                map.setCenter(pos);
                currentLatlng = pos;
                var geocoder = new google.maps.Geocoder();
                var latlng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
                var placeholderUpdate = '';
                geocoder.geocode({ 'latLng': latlng }, function (results, status) {
                    if (status === google.maps.GeocoderStatus.OK) {
                        if (results.length > 0) {
                            for (var component in componentForm) {
                              if (component) {
                                document.getElementById(component).value = '';
                                document.getElementById(component).disabled = false;
                              }
                            }

                            for (var i = 0; i < results[0].address_components.length; i++) {
                                var addressType = results[0].address_components[i].types[0];
                                if (componentForm[addressType]) {
                                    var val = results[0].address_components[i][componentForm[addressType]];
                                    document.getElementById(addressType).value = val;
                                    placeholderUpdate += ' ' + val;
                                }
                            }
                            StoreLocator.LocationSearch(webserviceUrl, 'false');
                            requiredRegularSearch = false;
                        }
                      $(addressInput).attr('placeholder', placeholderUpdate.trim());
                    }
                });
            }, function () {
                handleLocationError(true, infowindow, map.getCenter());
            });
        } else {
            // Browser doesn't support Geolocation
            handleLocationError(false, infowindow, map.getCenter());
        }
    },
    Rad: function (x) {
        return x * Math.PI / 180;
    },
    GetDistance : function(p1, p2) {
        var isPlace = typeof p1.lat === 'function' && typeof p1.lng === 'function';
        var lat1 = isPlace ? p1.lat() : p1.lat;
        var lng1 = isPlace ? p1.lng() : p1.lng;
        var R = 6378137; // Earths mean radius in meter
        var dLat = StoreLocator.Rad(p2.lat - lat1);
        var dLong = StoreLocator.Rad(p2.lng - lng1);
        var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(StoreLocator.Rad(lat1)) * Math.cos(StoreLocator.Rad(p2.lat)) *
          Math.sin(dLong / 2) * Math.sin(dLong / 2);
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        var d = R * c;
        return d; // returns the distance in meter
    },
    GetByRegularSearch: function (address) {
        var geocoder = new google.maps.Geocoder();
        geocoder.geocode({ 'address': address }, function (results, status) {
            if (status === google.maps.GeocoderStatus.OK) {
                if (results.length > 0) {
                    var pos = {
                        lat: results[0].geometry.location.lat(),
                        lng: results[0].geometry.location.lng()
                    };
                    map.setCenter(pos);
                    currentLatlng = pos;
                    for (var component in componentForm) {
                      if (component) {
                        document.getElementById(component).value = '';
                        document.getElementById(component).disabled = false;
                      }
                    }

                    for (var i = 0; i < results[0].address_components.length; i++) {
                        var addressType = results[0].address_components[i].types[0];
                        if (componentForm[addressType]) {
                            var val = results[0].address_components[i][componentForm[addressType]];
                            document.getElementById(addressType).value = val;
                        }
                    }
                    StoreLocator.LocationSearch(webserviceUrl);
                }
            } else {
                console.log('Geocode was not successful for the following reason: ' + status);
            }
        });
    }
};
$(document).ready(function(){

    initialize();

    $(addressInput).on({
      'keyup': function(evt) {
        if (evt.which === 13) {
          StoreLocator.LocationSearch(webserviceUrl);
        }
        else {
          requiredRegularSearch = true;
        }
        if ($('#autocomplete').val() === '') {
          $('.fa-times-circle').hide();
        } else {
          $('.fa-times-circle').show();
        }
      },
      'paste': function(evt) {
        if (evt.which === 13) {
          StoreLocator.LocationSearch(webserviceUrl);
        }
        else {
          requiredRegularSearch = true;
        }
        if ($('#autocomplete').val() === '') {
          $('.fa-times-circle').hide();
        } else {
          $('.fa-times-circle').show();
        }
      }
    });

    $('.fa-times-circle').click(function () {
        $('.fa-times-circle').hide();
        $('#autocomplete').val('');
    });

    $('.map-list').show();
    $('.retailer-list').hide();

});

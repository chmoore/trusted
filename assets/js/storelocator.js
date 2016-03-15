/*jshint loopfunc: true*/
/*global Transparency */
/*global google */
/*global Throbber */
/*global InfoBox */
/*global MarkerWithLabel */
/*global handleLocationError */

var map, markerList = [], locations = [];
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

function initialize() {
  var defaultLat = 40.745812;
  var defaultLng = -100.913895;

  $(locatorForm).bind('submit', function(e) {
    e.preventDefault();
    return false;
  });

  brandDropdown.addEventListener('change', selectEndpoint);
  geoDetectButton.addEventListener('click', StoreLocator.DetectCurrentLocation);

  map = new google.maps.Map(document.getElementById('map'), {
      center: { lat: defaultLat, lng: defaultLng },
      zoom: 4,
      scrollwheel: false,
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
}

function selectEndpoint() {
  var selection = brandDropdown.value;
  if (!selection.length || selection === 'all-brands') {
    selectedOption.brand = 'all-brands';
    webserviceUrl = endpoints.all;
  } else {
    webserviceUrl = endpoints.brandAll + selection;
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

var StoreLocator = {
    LocationSearch: function (webserviceUrl) {
        var textCriteria = '';
        textCriteria = $('#autocomplete').val();
        var  addresstext = '';
        if($('#street_number').val() !== '' ||  $('#route').val() !== '') {
            addresstext = $('#street_number').val() + ',' + $('#route').val();
        }
        $.ajax({
            type: 'GET',
            url: webserviceUrl,
            data: { 'textSearch': textCriteria, 'address': addresstext, 'city': $('#locality').val(), 'state': $('#administrative_area_level_1').val(), 'zipcode': $('#postal_code').val() },
            dataType: 'json',
            success: function (response) {
                var completeHtml = '';
                for (var con = 0; con < response.length; con++) {
                    completeHtml += StoreLocator.GenerateCard(response[con], con);
                }
                map = new google.maps.Map(document.getElementById('map'), {
                    center: { lat: 40.745812, lng: -100.913895 },
                    zoom: 4,
                    scrollwheel: false,
                });
                if (response.length > 0) {
                    $('#dvResult').html(completeHtml);
                    StoreLocator.DrawMarker(response);
                }
                else {
                    $('#dvResult').html(StoreLocator.NoResultTemplate());
                }
                StoreLocator.ShowList();
                $('.card').click(function () {
                    var markerId = $(this).attr('id');
                    StoreLocator.OpenMarker(markerId);

                });
            },
            error: function (req, response) {
                console.log('Error:' + response);
            }
        });
        $('.google-map').height($('#dvResult').height());
        $('#dvResult').height($('.google-map').height());
    },
    GenerateCard: function (item, idx) {
        //0 markerlabel
        //1 miles
        //2 assets/logo/Richard-Mille-logo.png
        //3 Richard Mille Boutique
        //4 9700 Collins Ave, Bal Harbour, FL 33154
        var cardNum = idx + 1;
        var calculatedMeter = StoreLocator.GetDistance(currentLatlng, { 'lat': item.latitude, 'lng': item.longitude });
        var calculatedmile = (calculatedMeter / 1609.34).toFixed(2);
        var addressLine = item.address1 !== null && item.address2 !== null ? (item.address1 + '<br />' + item.address2) : (item.address1 || item.address2);
        var taddress = addressLine + ', ' + item.city + ', ' + item.state + ' ' + item.zipCode;
        var itemID = item.uniqueRetailerName+'_'+item.locationUniqueName;
        var logoOrNot = item.brandLogo !== null ? '<img src="' + $('#storeResultTemplate').find('img').attr('data-imgPath') + item.brandLogo + '" />'  : '';
        var templateCard = '<div class="resultCard card span12" id="'+ itemID + '">' + '<div class="span3 nopadding">' +
          '    <div class="numberCircle">' + cardNum + '</div>' +
          '    <div> <span class="miles">' + calculatedmile + ' mile(s)</span></div>' +
          '</div>' +
          '<div class="span9">' +
          logoOrNot +
          '    <h1 class="title">' + item.retailerName + '</h1>' +
          '    <span class="desc">' + taddress + '</span><br />' +
          '    <a class="link" href="javascript:StoreLocator.OpenMarker(\'' + itemID + '_details\'' + ')">Store Details</a>' +
          '</div>' +
          '</div>';
        return templateCard;
    },
    OpenMarker :function(id){
        for (var mc = 0; mc < markerList.length; mc++) {
            if (markerList[mc].Id === id) {
                google.maps.event.trigger(markerList[mc], 'click');

            }
        }
    },
    NoResultTemplate: function () {
        return '<div class="no-result"><p>No result found. Please refine you search criteria.</p></div>';
    },
    ShowList: function(){
        $('#dvResult').show();
        $('.google-map').css('margin-left', $('#dvResult').width() + 'px');
        $('#map').width(window.innerWidth - $('#dvResult').width());
    },
    HideList: function () {
        $('#dvResult').hide();
        $('.google-map').css('margin-left','');
    },
    DrawMarker: function (data) {
        markerList = [];
        locations = data;
        infowindow = new InfoBox({
            disableAutoPan: false,
            maxWidth: 450,
            pixelOffset: new google.maps.Size(-220, -225),
            zIndex: null,
            boxStyle: {
                // top arrow in the info window
                background: 'url("http://google-maps-utility-library-v3.googlecode.com/svn/trunk/infobox/examples/tipbox.gif") no-repeat',
                opacity: 0.9,
                width: '450px'
            },
            closeBoxMargin: '12px -36px 2px 2px',
            closeBoxURL: 'http://www.google.com/intl/en_us/mapfiles/close.gif', //close button icon
            infoBoxClearance: new google.maps.Size(1, 1)
        });
        var bounds = new google.maps.LatLngBounds();
        var marker;
        var image = {
            url: 'assets/images/marker.png',
            // This marker is 20 pixels wide by 32 pixels high.
            size: new google.maps.Size(40, 42),
            // The origin for this image is (0, 0).
            origin: new google.maps.Point(0, 0),
            // The anchor for this image is the base of the flagpole at (0, 32).
            anchor: new google.maps.Point(0, 32)
        };

        for (var i = 0; i < data.length; i++) {
            var retailer = data[i];
            var retailerId = retailer.uniqueRetailerName+'_'+retailer.locationUniqueName+'_details';
            marker = new MarkerWithLabel({
                position: { lat: retailer.latitude, lng: retailer.longitude },
                map: map,
                icon: image,
                Id: retailerId,
                labelContent: i+1,
                labelAnchor: new google.maps.Point(-18, 28),
                labelClass: 'labels', // the CSS class for the label
                labelStyle: { opacity: 0.75 }
            });

            google.maps.event.addListener(marker, 'click', (function (marker, i) {
                return function () {
                    var cards = $('.card');
                    for (var cd = 0; cd < cards.length; cd++) {
                        $(cards[cd]).removeClass('selected');
                    }
                    var localItem = locations[i];
                    $('#' + localItem.Id).addClass('selected');
                    console.log(localItem);
                    var storeList = StoreLocator.FormatStoreHours(localItem.storeHours);
                    console.log(storeList);

                    var storedetail = '';
                    for (var j = 0; j < storeList.length; j++) {
                        storedetail += '<span class="desc">' + storeList[j] + '</span><br>';
                    }
                    var localaddress = $('#street_number').val() + $('#route').val() + ', ' + $('#locality').val() + ', ' + $('#administrative_area_level_1').val() + $('#postal_code').val();
                    var drivinglink = 'http://maps.google.com/?saddr=' + currentLatlng.lat() + ',' + currentLatlng.lng() + '&daddr=' + localItem.latitude + ',' + localItem.longitude;
                    var addressLine = localItem.address1 !== null && localItem.address2 !== null ? (localItem.address1 + '<br />' + localItem.address2) : (localItem.address1 || localItem.address2);
                    console.log(drivinglink);
                    var logoArea = localItem.brandLogo !== null ? '<img src="' + $('#storeResultTemplate').find('img').attr('data-imgPath') + localItem.brandLogo + '" />'  : '';
                    infowindow.setContent('<div class="card info-card"><div class="span12">' +
                     logoArea + '</div><div class="span6">' + ' <h1 class="title">' + localItem.retailerName+ '</h1>' +
                     ' <span class="desc">' + addressLine + ', '  + localItem.city + ', ' + localItem.state + ' ' + localItem.zipCode + '</span><br>' +
                     '<a class="link" target="_blank" href="' + drivinglink + '">Driving Directions</a>' + '</div><div class="span6">' +
                     '<h1 class="title">Store Detail</h1>' + storedetail + '</div>');
                    infowindow.open(map, marker);
                    $('.gm-style-iw').next('div').remove();
                    map.setCenter({ 'lat': localItem.latitude, 'lng': localItem.longitude });
                };
            })(marker, i));
            map.setOptions({ maxZoom: 18 });
            bounds.extend(marker.position);
            markerList.push(marker);
        }

        map.fitBounds(bounds);
        map.setCenter();
    },
    FormatStoreHours: function (hoursObj) {
      if (typeof hoursObj === 'object') {
        //TODO temporary
        return '';
      }
    },
    DetectCurrentLocation: function () {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function (position) {
              console.log(position.coords);
            });
            navigator.geolocation.getCurrentPosition(function (position) {
                var pos = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                $(addressInput).attr('placeholder', position.coords.latitude + ',' + position.coords.longitude);
                map.setCenter(pos);
                currentLatlng = pos;
                var geocoder = new google.maps.Geocoder();
                var latlng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
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
                                }
                            }
                            StoreLocator.LocationSearch();
                            requiredRegularSearch = false;
                        }
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
        var R = 6378137; // Earths mean radius in meter
        var dLat = StoreLocator.Rad(p2.lat - p1.lat());
        var dLong = StoreLocator.Rad(p2.lng - p1.lng());
        var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(StoreLocator.Rad(p1.lat())) * Math.cos(StoreLocator.Rad(p2.lat)) *
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
                    StoreLocator.LocationSearch();
                }
            } else {
                console.log('Geocode was not successful for the following reason: ' + status);
            }
        });
    }
};
$(document).ready(function(){

    initialize();

    $('#autocomplete').keyup(function (ev) {
        console.log(ev.keyCode);
        if (ev.keyCode === 13) {
          StoreLocator.LocationSearch();
      }
      else {
          requiredRegularSearch = true;
      }
      if ($('#autocomplete').val() === '') {
          $('.fa-times-circle').hide();
      } else {
          $('.fa-times-circle').show();
      }
    });

    $('.fa-times-circle').click(function () {
        $('.fa-times-circle').hide();
        $('#autocomplete').val('');
    });

    $('.view-all-location').click(function () {
        $('.map-list').hide();
        $('.retailer-list').show();
    });

    $('.map-list').show();
    $('.retailer-list').hide();

});

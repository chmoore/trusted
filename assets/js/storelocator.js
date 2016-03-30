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
            dataType: 'json',
            success: function (response) {
                var cleanResponse = [];

                for (var result = 0; result < response.length; result++) {
                  var calculatedMeter = StoreLocator.GetDistance(currentLatlng, { 'lat': response[result].latitude, 'lng': response[result].longitude });
                  var validPlaceCond = (response[result].latitude !== null || response[result].longitude !== null);
                  if (validPlaceCond) {
                    response[result].metersAway = calculatedMeter;
                    cleanResponse.push(response[result]);
                  }
                }

                var distSortData = cleanResponse.sort(function(a, b) {
                  return a.metersAway - b.metersAway;
                });

                var completeHtml = [];
                for (var con = 0; con < cleanResponse.length; con++) {
                    completeHtml.push(StoreLocator.GenerateCard(cleanResponse[con], con));
                }
                map = new google.maps.Map(document.getElementById('map'), {
                    center: { lat: 40.745812, lng: -100.913895 },
                    zoom: 4,
                    scrollwheel: false,
                });

                var sortedHtmlString = '';
                for (var res = 0; res < completeHtml.length; res++) {
                  sortedHtmlString += completeHtml[res].templateCard.replace(/@/g,'<div class="numberCircle">' + (res + 1) + '</div>');
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

        $(window).on('resize', function () {
          $('.google-map').width($(document).width());
          google.maps.event.trigger('resize');
        });

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
        var taddress = addressLine + ', ' + item.city + ', ' + item.state + ' ' + item.zipCode;
        var itemID = StoreLocator.SanitizeId(item.brandUniqueName+'_'+item.locationUniqueName);
        var logoOrNot = item.brandLogo !== null ? '<img src="' + $('#storeResultTemplate').find('img').attr('data-imgPath') + item.brandLogo + '" />'  : '';
        var templateObj = {
          'templateCard' : '<div class="resultCard card span12" id="'+ itemID + '">' + '<div class="span3 nopadding">' +
          //Index when sorted
          '@' +
          '    <div> <span class="miles">' + calculatedmile + ' mile(s)</span></div>' +
          '</div>' +
          '<div class="span9">' +
          logoOrNot +
          '    <h1 class="title">' + item.retailerName + '</h1>' +
          '    <span class="desc">' + taddress + '</span><br />' +
          '    <a class="link" href="/stores/' + item.locationUniqueName  + '">Store Details</a>' +
          '</div>' +
          '</div>'
        };
                return templateObj;
    },
    OpenMarker :function(id){
        for (var mc = 0; mc < markerList.length; mc++) {
            if (markerList[mc].Id === id) {
                google.maps.event.trigger(markerList[mc], 'click');

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
                background: 'url("https://google-maps-utility-library-v3.googlecode.com/svn/trunk/infobox/examples/tipbox.gif") no-repeat',
                opacity: 0.9,
                width: '450px'
            },
            closeBoxMargin: '12px -36px 2px 2px',
            closeBoxURL: 'https://www.google.com/intl/en_us/mapfiles/close.gif', //close button icon
            infoBoxClearance: new google.maps.Size(1, 1)
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
                    var $newHoursTable = $('<table class="store-hours"></table>');
                    var $storeHoursTable = $newHoursTable.html(StoreLocator.FormatStoreHours(localItem.storeHours)).get(0).outerHTML;
                    var localaddress = $('#street_number').val() + $('#route').val() + ', ' + $('#locality').val() + ', ' + $('#administrative_area_level_1').val() + $('#postal_code').val();
                    var drivinglink = 'https://maps.google.com/?saddr=' + currentLat + ',' + currentLng + '&daddr=' + localItem.latitude + ',' + localItem.longitude;
                    var addressLine = localItem.address1 !== null && localItem.address2 !== null ? (localItem.address1 + '<br />' + localItem.address2) : (localItem.address1 || localItem.address2);
                    var logoArea = localItem.brandLogo !== null ? '<img src="' + $('#storeResultTemplate').find('img').attr('data-imgPath') + localItem.brandLogo + '" />'  : '';
                    infowindow.setContent('<div class="card info-card"><div class="span12 info-card-logo">' +
                     logoArea + '</div><div class="span6">' + ' <h1 class="title">' + localItem.retailerName+ '</h1>' +
                     ' <span class="desc">' + addressLine + ', '  + localItem.city + ', ' + localItem.state + ' ' + localItem.zipCode + '</span><br />' +
                     '<a class="link" target="_blank" href="/stores/' + localItem.locationUniqueName + '">View Store Details</a><br />' +
                     '<a class="link" target="_blank" href="' + drivinglink + '">Driving Directions</a>' + '</div><div class="span6">' +
                     '<h1 class="title">Store Detail</h1>' + $storeHoursTable + '</div>');
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
    FormatStoreHours: function (storeHoursObj) {
      if (typeof storeHoursObj === 'object' && storeHoursObj.length) {
          var hoursTableArr = [];
          var itemsDone = [];

          var daysLength = storeHoursObj.length;
          var isCurrentDay = function(dayName) {
            var dateNow = new Date();
            var dayIndex = dateNow.getDay();
            var dayNames = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
            var todayIs = dayNames[dayIndex];
            if (todayIs === dayName) {
                return ' class="currentDay"';
            } else {
              return '';
            }
          };

          for (var k = 0; k < storeHoursObj.length; k++) {
            if (!storeHoursObj[k].closed) {
              var OpenTableLine = '<tr' + isCurrentDay(storeHoursObj[k].day) + '>' +
                '<td class="dayCol" colspan="2">' + storeHoursObj[k].day.toLowerCase() + '</td>' +
                '<td>' + storeHoursObj[k].startTime.replace(/\./g, '') + '</td>' +
                '<td class="timeSep">&ndash;</td>' +
                '<td>' + storeHoursObj[k].closeTime.replace(/\./g, '') + '</td>' +
                '</tr>';
              hoursTableArr.push(OpenTableLine);
            } else {
              var ClosedTableLine = '<tr' + isCurrentDay(storeHoursObj[k].day) + '>' +
                '<td class="dayCol' + isCurrentDay(storeHoursObj[k].day) + '" colspan="2">' + storeHoursObj[k].day.toLowerCase() + '</td>' +
                '<td>' + 'CLOSED' + '</td>' +
                '</tr>';
              hoursTableArr.push(ClosedTableLine);
            }
          }
          return hoursTableArr.join();
      } else {
        return 'Call for Store Hours';
      }

    },
    DetectCurrentLocation: function () {
        if (navigator.geolocation) {
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
                            StoreLocator.LocationSearch(webserviceUrl);
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

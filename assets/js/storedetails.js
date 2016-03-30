/* STORE DETAILS GOOGLE MAP */

(function ($) {
  $(document).ready(function(){
    var gMapEl = document.getElementById('ret-map'),
      Lat = gMapEl.getAttribute('data-latitude'),
      Lng = gMapEl.getAttribute('data-longitude'),
      coordinates = new google.maps.LatLng(Lat,Lng);

    function initialize() {
      var mapProperties = {
        center:               coordinates,
        mapTypeControlOptions: {
          style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
            position: google.maps.ControlPosition.LEFT_BOTTOM
        },
        mapTypeId:            google.maps.MapTypeId.ROADMAP,
        streetViewControl:    false,
        zoom:                 16,
        zoomControl:          false
      };

      var map = new google.maps.Map(document.getElementById('detailsGMap'), mapProperties),
        marker = new google.maps.Marker({
          position: coordinates
        });
      marker.setMap(map);
    }

    google.maps.event.addDomListener(window, 'load', initialize);

    });

}(jQuery));

/*global Transparency */

// Retailers view controller

//Requires Transparency.js for lightweight JS templating
jQuery.fn.render = Transparency.jQueryPlugin;

(function ($) {
  $(document).ready(function() {
    var $brandDrop = $('#select-storelist-brand'),
      $countryDrop = $('#select-storelist-country'),
      $retailerListContainer = $('#retailers-listing'),
      $retailerCont = $('.retailer-container.render').remove(),
      brandIndex = [],
      retailerIndex = [],
      selectedOption = {
        'brand' : 'all-brands',
        'country' : 'all-countries'
      },
      endpoints = {
        //All brands, all countries
        'all' : '/webservices/store/storelist',
        //List all brands available in specific country: /store/manufacturer/name/<country>
        'countryHasBrands' : '/webservices/store/manufacturer/names/',
        //List of countries for a selected brand: store/countrieslist/<manufacturerId>
        'brandHasCountries' : '/webservices/store/countrieslist/',
        //All brands and listings for this country: store/storelist/<country>
        'countryAll': '/webservices/store/storelist/',
        //All locations for this brand in every countries: store/manufacturer/storelist/<manufacturerId>
        'brandAll' : '/webservices/store/manufacturer/storelist/',
        //Locations for selected brand in selected country: store/storelist/<manufacturerId>/<country>
        'brandCountryDetail' : '/webservices/store/storelist/'
      };

      //Load
      var init = function() {
        selectListener();
        getRetailerData(endpoints.all);
      };

      //Getter: GET request to endpoint with serial number, call results fn if successful
      var getRetailerData = function(webserviceUrl, isDropdown) {
        if (webserviceUrl && typeof webserviceUrl === 'string') {
          $.get(webserviceUrl)
          .done(function(data) {
            if (isDropdown) {
              updateDropdowns(data, isDropdown);
            } else {
              outputResults(data);
            }
          })
          .fail(function(xhr) {
            if (isDropdown) {
              outputResults([], isDropdown, 'fail');
            } else {
              updateDropdowns([], 'fail');
            }
          });
        }
      };

      //After dropdowns data refreshed, update options
      var updateDropdowns = function(data, dropdownType, callResult) {
        if (data.length && typeof dropdownType === 'string') {
          if (dropdownType === 'brandDropdown') {
            //Update $countryDrop
            var countryOptions = [];
            countryOptions.push($countryDrop.children('option[attr="disabled"], option[value="all-countries"]'));
            for (var j=0; j < data.length; j++) {
              var countryOptionValue = data[j].countryCode,
                  countryOptionTxt = data[j].countryName,
                  countryOptionResult = '<option value="' + countryOptionValue + '">' + countryOptionTxt + '</option>';
                  countryOptions.push(countryOptionResult);
            }
            $countryDrop.html(countryOptions);
          }
          if (dropdownType === 'countryDropdown') {
            //Update $brandDrop
            var brandOptions = [];
            brandOptions.push($brandDrop.children('option[attr="disabled"], option[value="all-brands"]'));
            for (var k=0; k < data.length; k++) {
              var brandOptionValue = data[[k]].brandUniqueName,
                  brandOptionTxt = data[[k]].brandName,
                  brandOptionResult = '<option value="' + brandOptionValue + '">' + brandOptionTxt + '</option>';
                  brandOptions.push(brandOptionResult);
            }
            $brandDrop.html(brandOptions);
          }
        }
      };

      //Take results of getRetailerData and template up, display
      var outputResults = function(data, callResult) {
        if (data.length && typeof jQuery.fn.render === 'function') {
          //Reset (important when dropdowns change)
          brandIndex = [];
          retailerIndex = [];
          $retailerListContainer.empty();

          //Begin Transparency.js template decorators, massages data for templates
          var logoDecorator = function(params) {
            var $logoEle = $(params.element);
            var imgBasePath = $logoEle.attr('data-imgpath');
            if (this.brandLogo !== null) {
              //TODO: Must move this out into abstract config url
                return '<img src="' + imgBasePath + this.brandLogo + '" alt="' + this.brandName + '" />';
            } else {
              return '<h2>' + this.brandName + '</h2>';
            }
          };

          //Adjust data as classname didn't match field name
          var countryDecorator = function() {
            return this.countryName;
          };

          //Helps when retailers don't have a defined URL
          var retailerDecorator = function() {
            if (this.url !== null) {
              return '<a href="' + this.url + '">' + this.retailerName + '</a>';
            } else {
              return this.retailerName;
            }
          };

          //Stamps on country data attr
          var countrySort = function(params) {
            var $countryContainer = $(params.element);
            $countryContainer.attr('data-country', this.countryName);
          };

          //Stamps on state data attr
          var statesSort = function(params) {
            var $stateContainer = $(params.element);
            $stateContainer.attr('data-state', this.state);
          };

          //Helps prevent duplicate headings
          var uniqueListing = function(params) {
            var $listingEle = $(params.element);

            //Prevent bad data
            if (this.state === null || this.city === null || this.retailerName === null) {
              $listingEle.remove();
            }

            //Prevent dupes
            $listingEle.find('.retailer').attr('data-retailer', this.locationUniqueName);

            if (retailerIndex.indexOf(this.locationUniqueName) === -1) {
              retailerIndex.push(this.locationUniqueName);
              if (brandIndex.indexOf(this.brandUniqueName) === -1) {
                brandIndex.push(this.brandUniqueName);
                $listingEle.attr('data-brand', this.brandUniqueName);
              } else {
                var $groupEle = $listingEle.parent().find('div.store-list[data-brand="' + this.brandUniqueName + '"]');
                if ($groupEle.find('.retailer-wrap[data-country="' + this.countryName + '"]').length) {
                  if ($groupEle.children('.retailer-wrap').find('.state-container[data-state="' + this.state + '"]').length) {
                    //Group same state
                    $groupEle.children('.retailer-wrap').find('.state-container[data-state="' + this.state + '"]').append($listingEle.find('.retailer'));
                    $listingEle.remove();
                  } else {
                    //Different state
                    $groupEle.find('.retailer-wrap[data-country="' + this.countryName + '"]').append($listingEle.find('.retailer-text'));
                    $listingEle.remove();
                  }
                } else {
                  //Add country heading to brand
                  $groupEle.append($listingEle.find('.retailer-wrap'));
                  $listingEle.remove();
                }
              }
            } else {
              $listingEle.remove();
            }


          };

          //Transparency.js render directives, see above
          var directives = {
            logo: {
              html: logoDecorator
            },
            country: {
              text: countryDecorator
            },
            retailerName: {
              html: retailerDecorator
            },
            'retailer-wrap' : {
              html: countrySort
            },
            'state-container' : {
              html: statesSort
            },
            'store-list' : {
              html: uniqueListing
            }
          };

          //Clone new listing element, render data with Transparency.js
          var $brandListing = $retailerCont.clone().render(data, directives).removeClass('render hide');
          $brandListing.find('.store-list').first().removeClass('single-line');
          $retailerListContainer.append($brandListing);
          //End Transparency.js templating logic
        }

        if (callResult === 'fail') {
          console.log('API failure');
        }

      };

      //Dropdown change triggered, filter accordingly
      var filterUpdate = function(e) {
        var selValue = e.target.value,
          filterType = e.target.dataset.type;

          if (selValue.length && filterType === 'brand') {
            selectedOption.brand = selValue;
            if (selectedOption.country === 'all-countries') {
              //update Country dropdown
              getRetailerData(endpoints.brandHasCountries+selValue, 'brandDropdown');
              getRetailerData(endpoints.brandAll+selValue);
            }
          }

          if (selValue.length && filterType === 'country') {
            selectedOption.country = selValue;
            if (selectedOption.brand === 'all-brands') {
              //update Brand dropdown
              selectedOption.country = selValue;
              getRetailerData(endpoints.countryHasBrands+selValue, 'countryDropdown');
              getRetailerData(endpoints.countryAll+selValue);
            }
          }

          if (selectedOption.brand === 'all-brands' && selectedOption.country === 'all-countries') {
            getRetailerData(endpoints.all);
          } else if (selectedOption.brand !== 'all-brands' && selectedOption.country !== 'all-countries') {
            getRetailerData(endpoints.brandCountryDetail+selectedOption.brand+'/'+selectedOption.country);
          } else {
            getRetailerData(endpoints.brandAll+selectedOption.brand);
          }

      };

      //Listener: Bind event listeners to dropdowns
      var selectListener = function() {
        $brandDrop.on('change', filterUpdate);
        $countryDrop.on('change', filterUpdate);
      };

      init();

  });

} (jQuery));

